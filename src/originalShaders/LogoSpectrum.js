import{defineShader,ControlType}from"framer";export default defineShader({title:"Logo Spectrum",heightmapSource:"image",fragment:`
const float DEG2RAD = 0.01745329;
const float TWO_PI = 6.28318530718;

float blurDepth3x3(vec2 uv, vec2 dudx, vec2 dudy, vec2 texel, float radius) {
    vec2 r = radius * texel;
    float sum = 4.0 * textureGrad(u_image_heightmap, uv, dudx, dudy).r;
    sum += 2.0 * textureGrad(u_image_heightmap, uv + vec2(0.0, -r.y), dudx, dudy).r;
    sum += 2.0 * textureGrad(u_image_heightmap, uv + vec2(0.0,  r.y), dudx, dudy).r;
    sum += 2.0 * textureGrad(u_image_heightmap, uv + vec2(-r.x, 0.0), dudx, dudy).r;
    sum += 2.0 * textureGrad(u_image_heightmap, uv + vec2( r.x, 0.0), dudx, dudy).r;
    sum += textureGrad(u_image_heightmap, uv + vec2(-r.x, -r.y), dudx, dudy).r;
    sum += textureGrad(u_image_heightmap, uv + vec2( r.x, -r.y), dudx, dudy).r;
    sum += textureGrad(u_image_heightmap, uv + vec2(-r.x,  r.y), dudx, dudy).r;
    sum += textureGrad(u_image_heightmap, uv + vec2( r.x,  r.y), dudx, dudy).r;
    return sum / 16.0;
}

vec2 heightGrad(vec2 uv, vec2 dudx, vec2 dudy, vec2 texel, float blurRadius) {
    float eps = 12.0;
    float dR = blurDepth3x3(uv + vec2(eps * texel.x, 0.0), dudx, dudy, texel, blurRadius);
    float dL = blurDepth3x3(uv - vec2(eps * texel.x, 0.0), dudx, dudy, texel, blurRadius);
    float dU = blurDepth3x3(uv + vec2(0.0, eps * texel.y), dudx, dudy, texel, blurRadius);
    float dD = blurDepth3x3(uv - vec2(0.0, eps * texel.y), dudx, dudy, texel, blurRadius);
    return vec2(dR - dL, dU - dD) / (2.0 * eps * texel);
}

float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// --- cyclic noise -----------------------------------------------
mat3 getOrthogonalBasis(vec3 z) {
    z = normalize(z);
    vec3 up = abs(z.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(0.0, 0.0, 1.0);
    vec3 x = normalize(cross(up, z));
    return mat3(x, cross(z, x), z);
}

vec3 cyclicNoise(vec3 p, float pump) {
    vec4 sum = vec4(0.0);
    mat3 basis = getOrthogonalBasis(vec3(-1.0, 2.0, -3.0));
    for (int i = 0; i < 5; i++) {
        p *= basis;
        p += sin(p.yzx);
        sum += vec4(cross(cos(p), sin(p.zxy)), 1.0);
        sum *= pump;
        p *= 2.0;
    }
    return sum.xyz / sum.w;
}

void main() {
    // === HEIGHTMAP UV (aspect-corrected) ===
    vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
    vec2 texSize = vec2(textureSize(u_image_heightmap, 0));
    float imgAspect = texSize.x / texSize.y;
    float canvasAspect = u_resolution.x / u_resolution.y;

    if (canvasAspect > imgAspect) {
        uv.x = (uv.x - 0.5) * (canvasAspect / imgAspect) + 0.5;
    } else {
        uv.y = (uv.y - 0.5) * (imgAspect / canvasAspect) + 0.5;
    }

    // Logo-space scan coordinate (locked to the logo, not the canvas).
    // x is scaled by the logo's aspect so the scan direction is geometrically
    // correct, and y is flipped to match the previous screenY orientation.
    vec2 scanUV = vec2(uv.x * imgAspect, 1.0 - uv.y);

    vec2 dudx = dFdx(uv);
    vec2 dudy = dFdy(uv);

    vec4 hm = textureGrad(u_image_heightmap, uv, dudx, dudy);
    float fw_b = 0.5 * fwidth(hm.b);
    float hardMask = smoothstep(0.5 - fw_b, 0.5 + fw_b, hm.b);
    float opacity = hardMask * (1.0 - hm.g);

    float edgeDist = canvasAspect > imgAspect
        ? min(uv.x, 1.0 - uv.x)
        : min(uv.y, 1.0 - uv.y);
    opacity *= smoothstep(0.0, fwidth(edgeDist), edgeDist);

    if (opacity < 0.001) {
        fragColor = vec4(u_colorBack.rgb * u_colorBack.a, u_colorBack.a);
        return;
    }

    vec2 texel = 1.0 / texSize;
    float depth = max(blurDepth3x3(uv, dudx, dudy, texel, 6.0), 0.001);

    vec2 hGrad = heightGrad(uv, dudx, dudy, texel, 12.0);
    float gradMag = length(hGrad);
    vec2 gradDir = gradMag > 0.001 ? hGrad : vec2(0.0);
    vec2 contourDir = vec2(-gradDir.y, gradDir.x);

    float edgeProximity = 1.0 - smoothstep(0.0, u_edge, depth);

    float t = u_time * u_speed * 10.0;

    float angleRad = (u_angle + u_time * u_sweepSpeed * u_speed * 60.0) * DEG2RAD;
    vec2 scanDir = vec2(cos(angleRad), sin(angleRad));
    float scanBase = dot(scanUV, scanDir);

    float deflection = (depth - 0.5) * u_deflection * 0.06;

    float outerSoft = smoothstep(0.0, mix(0.001, 0.5, 2.), depth);

    float bevelEnv = smoothstep(0.0, 0.55, edgeProximity);
    bevelEnv      *= bevelEnv;
    bevelEnv      *= outerSoft; 
    float bevelOffset = dot(contourDir, scanDir) * bevelEnv * u_bend * 0.07 * 0.5
                     -  dot(gradDir,    scanDir) * bevelEnv * u_bend * 0.025 * 0.5;

    float lineY = scanBase + deflection + bevelOffset + u_offset;

    float viscN        = clamp(u_viscosity / 3.0, 0.0, 1.0);
    float lineWidthExp = mix(20.0, 1.0, viscN);
    float bloomWeight  = mix(0.15, 0.7, viscN);
    float softExp      = mix(2.4, 1.1, viscN);
    float densityPhase = u_density * 180.0;

    // ---- SDF-based scan lines with cyclic-noise displacement -----------
    float phase = (lineY - t * 0.025) * densityPhase - 1.5707963;

    // Noise coordinate also lives in logo-space so distortion is locked to logo.
    vec3 np = vec3(scanUV * u_noiseScale, u_time * 0.15 * u_distortSpeed);

    // Clean SDF → glow.
    float sdClean = phase - TWO_PI * floor(phase / TWO_PI + 0.5);
    float peakClean = 0.5 + 0.5 * cos(sdClean);

    // Distort gating — when the boolean is off, both noise and dispersion zero out.
    float noiseAmt   = u_distort > 0.5 ? u_noiseAmount : 0.0;
    float dispAmpVal = u_distort > 0.5 ? u_dispersion  : 0.0;

    // Line core with optional ephemeral dispersion trail.
    float peakNoisy = 0.0;
    float peakNoisyWeight = 0.0;
    int SAMPLES = dispAmpVal > 0.001 ? 5 : 1;
    float dispAmp = dispAmpVal;

    for (int i = 0; i < 5; i++) {
        if (i >= SAMPLES) break;

        // ephemeral ramp: 0 at head, ~1 at tail
        float eph = SAMPLES > 1 ? float(i) / float(SAMPLES - 1) : 0.0;
        float sqEph = eph * eph;

        // Slightly time-offset slice per sample — creates the drip/trail.
        vec3 npS = np + vec3(0.0, 0.0, -sqEph * dispAmp * 0.8);

        vec3 n3 = cyclicNoise(npS, 1.5);
        // Project noise onto scan direction so it wiggles lines sideways.
        float n = dot(n3.xy, scanDir);

        float amp = 1.0 + dispAmp * sqEph * 0.6;
        float sdNoisy = sdClean + n * noiseAmt * amp * TWO_PI * 0.5;

        float w = mix(1.0, 1.0 - sqEph * 0.5, dispAmp);
        peakNoisy += (0.5 + 0.5 * cos(sdNoisy)) * w;
        peakNoisyWeight += w;
    }
    peakNoisy /= max(peakNoisyWeight, 0.001);

    float fadeRamp = smoothstep(0.0, 0.4, depth);
    float lineFade = mix(1.0, fadeRamp, clamp(u_lineFade, 0.0, 1.0));

    float line     = pow(peakNoisy, lineWidthExp) * lineFade;
    float lineSoft = pow(peakNoisy, softExp) * lineFade;
    float lineGlow = pow(peakNoisy, 0.45) * lineFade;

    float coarseMod = mix(0.9, 1.1, 0.5 + 0.5 * sin(lineY * densityPhase * 0.08 + t * 0.4));

    float contourHeat = (1.0 - smoothstep(0.0, 0.25, depth)) * u_contour;

    vec3 tint = u_baseColor.rgb;
    float centerBoost = mix(0.75, 1.1, smoothstep(0.0, 0.35, depth));
    float floorGlow = 0.05 * smoothstep(0.0, 0.4, depth);

    float grain = hash21(v_uv * vec2(1920.0, 1080.0) + floor(t * 12.0));
    float grainMod = 1.0 + (grain - 0.5) * 2.0 * u_grain * 0.25;

    float bodyIntensity = (
        floorGlow
        + (line + lineSoft * bloomWeight + lineGlow * u_glow * 0.35) * u_exposure
        + contourHeat * 1.4
    ) * centerBoost * coarseMod * grainMod;

    vec3 rimHot = vec3(contourHeat * line * u_exposure * 0.9);
    vec3 peakHighlight = vec3(smoothstep(0.7, 1.0, line) * u_glow * u_exposure * 0.6);

    vec3 bodyCol = tint * bodyIntensity + rimHot + peakHighlight;

    float luma = dot(bodyCol, vec3(0.2126, 0.7152, 0.0722));
    bodyCol = mix(vec3(luma), bodyCol, u_saturation);
    bodyCol += tint * u_ambient * depth;

    bodyCol = bodyCol / (1.0 + max(bodyCol - 1.0, 0.0));

    vec3 bgColor = u_colorBack.rgb * u_colorBack.a;
    float bgAlpha = u_colorBack.a;

    vec3 finalCol = bgColor * (1.0 - opacity) + bodyCol * opacity;
    float finalAlpha = bgAlpha + opacity * (1.0 - bgAlpha);

    fragColor = vec4(finalCol, finalAlpha);
}
`,propertyControls:{image:{type:ControlType.ResponsiveImage,title:"Image",defaultValue:"data:framer/asset-reference,7XHsXmlUUmdQM95fkSvi3LRCuSk.svg?originalFilename=Path.svg&width=32&height=48"},colorBack:{type:ControlType.Color,title:"Background",defaultValue:"#000000"},baseColor:{type:ControlType.Color,title:"Surface",defaultValue:"#444444"},speed:{type:ControlType.Number,title:"Speed",defaultValue:.3,min:0,max:2,step:.1},offset:{type:ControlType.Number,title:"Offset",defaultValue:.21,min:0,max:1,step:.01,hiddenWhenUnset:true},angle:{type:ControlType.Number,title:"Angle",defaultValue:225,min:0,max:360,step:1},sweepSpeed:{type:ControlType.Number,title:"Sweep",defaultValue:0,min:-1,max:1,step:.1},glow:{type:ControlType.Number,title:"Glow",defaultValue:.7,min:0,max:2,step:.01,hidden:true},bend:{type:ControlType.Number,title:"Bevel",defaultValue:.34,min:0,max:1,step:.01,section:"Shape"},edge:{type:ControlType.Number,title:"Edge",defaultValue:1,min:0,max:1,step:.01,section:"Shape"},contour:{type:ControlType.Number,title:"Contour",defaultValue:1,min:0,max:3,step:.01,section:"Shape"},density:{type:ControlType.Number,title:"Density",defaultValue:.08,min:.01,max:.2,step:.01},viscosity:{type:ControlType.Number,title:"Glow",defaultValue:.5,min:0,max:2,step:.01},deflection:{type:ControlType.Number,title:"Deflection",defaultValue:3,min:0,max:3,step:.05},distort:{type:ControlType.Boolean,title:"Distort",defaultValue:false,enabledTitle:"Yes",disabledTitle:"No"},noiseAmount:{type:ControlType.Number,title:"Amount",defaultValue:.5,min:0,max:4,step:.1,hidden:props=>!props.distort},distortSpeed:{type:ControlType.Number,title:"Speed",defaultValue:1,min:0,max:2,step:.1,hidden:props=>!props.distort},noiseScale:{type:ControlType.Number,title:"Scale",defaultValue:1.5,min:.1,max:8,step:.1,hidden:props=>!props.distort},dispersion:{type:ControlType.Number,title:"Ephemeral",defaultValue:0,min:0,max:1,step:.01,hidden:props=>!props.distort},lineFade:{type:ControlType.Number,title:"Line Fade",defaultValue:0,min:0,max:1,step:.01,hidden:true},grain:{type:ControlType.Number,title:"Grain",defaultValue:0,min:0,max:1,step:.01,hiddenWhenUnset:true},ambient:{type:ControlType.Number,title:"Ambient",defaultValue:0,min:0,max:.2,step:.01,section:"Filters",hidden:true},saturation:{type:ControlType.Number,title:"Saturation",defaultValue:1.2,min:0,max:3,step:.01,section:"Filters",hidden:true},exposure:{type:ControlType.Number,title:"Exposure",defaultValue:1.4,min:.2,max:4,step:.05,section:"Filters",hidden:true}}});
export const __FramerMetadata__ = {"exports":{"default":{"type":"shader","name":null,"annotations":{"framerContractVersion":"1"}},"__FramerMetadata__":{"type":"variable"}}}
//# sourceMappingURL=./LogoSpectrum.map