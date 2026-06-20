import{defineShader,ControlType}from"framer";export default defineShader({title:"Logo Crystal",heightmapSource:"image",fragment:`
const float DEG2RAD = 0.01745329;
const float IOR_BASE = 1.5;
const vec3  BORDER_COLOR = vec3(1.0);

// === HELPERS ===

// --- value noise + FBM ---
float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// FBM
float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 2; i++) {
        v += a * valueNoise(p);
        p = rot * p * 2.0;
        a *= 0.5;
    }
    return v;
}

// 9-tap weighted blur of the depth (R) channel.
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

vec2 heightGrad(vec2 uv, vec2 dudx, vec2 dudy, vec2 texel) {
    float eps = 12.0;
    float dR = blurDepth3x3(uv + vec2(eps * texel.x, 0.0), dudx, dudy, texel, 12.0);
    float dL = blurDepth3x3(uv - vec2(eps * texel.x, 0.0), dudx, dudy, texel, 12.0);
    float dU = blurDepth3x3(uv + vec2(0.0, eps * texel.y), dudx, dudy, texel, 12.0);
    float dD = blurDepth3x3(uv - vec2(0.0, eps * texel.y), dudx, dudy, texel, 12.0);
    return vec2(dR - dL, dU - dD) / (2.0 * eps * texel);
}

// === MAIN ===

void main() {
    vec2 res = u_resolution;
    vec2 fragCoord = gl_FragCoord.xy;

    vec2 screenUV = fragCoord / res;
    screenUV.y = 1.0 - screenUV.y;

    // === COVER-FIT BACKGROUND TEXTURE ===
    vec2 bgRes = vec2(textureSize(u_bgTexture, 0));
    vec2 bgRatio = res / bgRes;
    float bgMaxRatio = max(bgRatio.x, bgRatio.y);
    vec2 cover = bgRatio / bgMaxRatio;

    float scale = max(u_bgScale, 1.0);

    vec2 maxOff = max(vec2(0.0), 0.5 * (1.0 - cover / scale));
    vec2 offset = vec2(u_bgOffsetX, -u_bgOffsetY) * maxOff;

    vec2 centered = (screenUV - 0.5) * cover / scale - offset;

    // Sweep
    float sweepPhase = mod(u_time * u_bgSweep * 0.02 * u_bgSpeed, 1.0) * 360.0;
    float rotAngle = (u_bgAngle + sweepPhase) * DEG2RAD;
    float cs = cos(rotAngle);
    float sn = sin(rotAngle);
    centered = mat2(cs, -sn, sn, cs) * centered;

    // FBM-based domain warp
    if (u_bgWarp > 0.001) {
        vec2 seedOffset = vec2(u_noiseSeed * 13.7, u_noiseSeed * 29.3);
        vec2 fbmCoord = centered * u_noiseScale + seedOffset;
        float t = mod(u_time, 3600.0) * u_bgSpeed;
        float fx = fbm(fbmCoord + vec2(t * 0.1, 0.0));
        float fy = fbm(fbmCoord + vec2(0.0, t * 0.13) + vec2(7.3, 11.7));
        centered += (vec2(fx, fy) - 0.5) * 0.04 * u_bgWarp;
    }

    vec2 bgUV = centered + 0.5;

    vec2 bgDudx = dFdx(bgUV);
    vec2 bgDudy = dFdy(bgUV);

    // === HEIGHTMAP UV ===
    vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
    vec2 hmRes = vec2(textureSize(u_image_heightmap, 0));
    float imgAspect    = hmRes.x / hmRes.y;
    float canvasAspect = res.x / res.y;

    if (canvasAspect > imgAspect) {
        uv.x = (uv.x - 0.5) * (canvasAspect / imgAspect) + 0.5;
    } else {
        uv.y = (uv.y - 0.5) * (imgAspect / canvasAspect) + 0.5;
    }

    float aaScale = max(1.0, 2.0 / u_pixelRatio);

    vec2 dudx = dFdx(uv);
    vec2 dudy = dFdy(uv);
    vec2 texel = 1.0 / hmRes;

    vec4 hm = textureGrad(u_image_heightmap, uv, dudx, dudy);
    float fw_b = fwidth(hm.b) / aaScale;
    float hardMask = smoothstep(0.5 - fw_b, 0.5 + fw_b, hm.b);
    float opacity = hardMask * (1.0 - hm.g);

    float edgeDist;
    if (canvasAspect > imgAspect) {
        edgeDist = min(uv.x, 1.0 - uv.x);
    } else if (canvasAspect < imgAspect) {
        edgeDist = min(uv.y, 1.0 - uv.y);
    } else {
        edgeDist = 1.0;
    }
    opacity *= smoothstep(0., fwidth(edgeDist), edgeDist);

    // === OUTSIDE-OF-LOGO COLOR ===
    bool clip = u_clipBackground > 0.5;

    if (opacity < 0.001) {
        vec3 outsideRGB;
        float outsideAlpha;
        if (clip) {
            outsideRGB = u_colorBack.rgb;
            outsideAlpha = u_colorBack.a;
        } else {
            outsideRGB = textureGrad(u_bgTexture, bgUV, bgDudx, bgDudy).rgb;
            outsideAlpha = 1.0;
        }
        fragColor = vec4(outsideRGB * outsideAlpha, outsideAlpha);
        return;
    }

    vec3 outsideRGB = clip ? u_colorBack.rgb : textureGrad(u_bgTexture, bgUV, bgDudx, bgDudy).rgb;
    float outsideAlpha = clip ? u_colorBack.a : 1.0;

    // === BEVEL / NORMAL ===
    float depth = max(blurDepth3x3(uv, dudx, dudy, texel, 6.0), 0.001);

    vec2  grad   = heightGrad(uv, dudx, dudy, texel);
    float gradMag = min(length(grad), 5.);

    vec2 refractDir = gradMag > 0.001 ? grad : vec2(0.0);
    vec2 dispersionDir = gradMag > 0.001 ? grad / gradMag : vec2(0.0);

    float boundaryFade = smoothstep(0.0, 0.05, depth);

    float falloffNorm = clamp(u_falloff / 20.0, 0.0, 1.0);
    float lensExp = mix(0.3, 3.0, falloffNorm);
    float lens    = pow(clamp(depth, 0.0, 1.0), lensExp);
    float edgeShape = (1.0 - lens) * boundaryFade;

    //Smoothen the edges
    float outerSoft = smoothstep(0.0, mix(0.001, 0.5, 2.), depth);
    edgeShape *= outerSoft;
    gradMag *= outerSoft;

    float contourMod = u_contour * 0.1 * boundaryFade;

    float dispersionGate = smoothstep(0.0, 0.5, gradMag * u_contour * 2.0) * boundaryFade;

    // === REFRACT BACKGROUND ===
    vec2  aspectComp = vec2(1.0 / canvasAspect, 1.0);
    float convexSign = u_convex > 0.5 ? 1.0 : -1.0;

    vec2 baseDelta = -convexSign * refractDir * edgeShape * contourMod * 2.0 * u_strength * aspectComp;

    vec3 refracted;
    if (u_dispersion <= 0.01) {
        refracted = textureGrad(u_bgTexture, bgUV + baseDelta, bgDudx, bgDudy).rgb;
    } else {
        vec3 wavelengths = vec3(0.65, 0.55, 0.45);
        float dispersionScaled = u_dispersion * 0.1;
        float iorMid = IOR_BASE + dispersionScaled / 0.3025;

        refracted = vec3(0.0);
        for (int c = 0; c < 3; c++) {
            float wl  = wavelengths[c];
            float ior = IOR_BASE + dispersionScaled / (wl * wl);

            float channelOffset = (ior - iorMid) * 2.0 * dispersionGate * u_strength;
            vec2 sampleUV = bgUV + baseDelta + dispersionDir * channelOffset * aspectComp;

            refracted[c] = textureGrad(u_bgTexture, sampleUV, bgDudx, bgDudy)[c];
        }
    }

    // === RIM / BORDER ===

    float rim = smoothstep(0.2, 0.9, gradMag) * edgeShape;
    vec3 col = refracted * (1.0 + rim * u_rimStrength);

    //col += rim * u_softness; //optional 

    float borderOuterFade = smoothstep(0.0, 0.15, depth);
    float innerIntensity = smoothstep(0.0, 0.6, depth);
    float borderBand = pow(1.0 - innerIntensity, 2.0) * borderOuterFade;

    vec2 outwardDir = gradMag > 0.001 ? -refractDir / gradMag : vec2(0.0);
    vec3 borderTint = textureGrad(u_bgTexture, bgUV + outwardDir * 0.05 * aspectComp, bgDudx, bgDudy).rgb;
    borderTint *= 4.;
    col = mix(col, borderTint, borderBand * u_borderStrength);

    // === FILTERS ===
    col *= u_brightness;
    col = (col - 0.5) * u_contrast + 0.5;
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(lum), col, u_saturation);

    col = clamp(col, 0.0, 1.0);

    // === COMPOSITE ===
    vec3  finalRGB = mix(outsideRGB, col, opacity);
    float finalA   = mix(outsideAlpha, 1.0, opacity);
    fragColor = vec4(finalRGB * finalA / max(finalA, 0.0001), finalA);
}
`,propertyControls:{image:{type:ControlType.ResponsiveImage,title:"Logo",defaultValue:"data:framer/asset-reference,7XHsXmlUUmdQM95fkSvi3LRCuSk.svg?originalFilename=Path.svg&width=32&height=48"},bgTexture:{type:ControlType.ResponsiveImage,title:"Image",defaultValue:"data:framer/asset-reference,r9R0BfFW0wzdsNVqqTWrcR5ttgo.png?originalFilename=stellars-2.png&width=2944&height=1648"},colorBack:{type:ControlType.Color,title:"Background",defaultValue:"rgba(0,0,0,1)"},bgScale:{type:ControlType.Number,title:"Scale",defaultValue:1.2,min:1,max:5,step:.01},bgOffsetX:{type:ControlType.Number,title:"Offset X",defaultValue:-.2,min:-1,max:1,step:.01},bgOffsetY:{type:ControlType.Number,title:"Offset Y",defaultValue:1,min:-1,max:1,step:.01},bgAngle:{type:ControlType.Number,title:"Angle",defaultValue:0,min:0,max:360,step:1},bgWarp:{type:ControlType.Number,title:"Amount",defaultValue:12,min:0,max:20,step:.5,section:"Distort"},noiseSeed:{type:ControlType.Number,title:"Seed",defaultValue:0,min:0,max:100,step:1,section:"Distort"},bgSpeed:{type:ControlType.Number,title:"Speed",defaultValue:.3,min:0,max:3,step:.1,section:"Distort"},noiseScale:{type:ControlType.Number,title:"Scale",defaultValue:.5,min:.5,max:12,step:.1,section:"Distort"},bgSweep:{type:ControlType.Number,title:"Sweep",defaultValue:0,min:-1,max:1,step:.1,section:"Distort"},clipBackground:{type:ControlType.Boolean,title:"Clip BG",defaultValue:true,enabledTitle:"Logo",disabledTitle:"Full",hidden:true},falloff:{type:ControlType.Number,title:"Bevel",defaultValue:3,min:0,max:20,step:.1,section:"Glass"},contour:{type:ControlType.Number,title:"Contour",defaultValue:.5,min:0,max:1,step:.01,section:"Glass"},strength:{type:ControlType.Number,title:"Refraction",defaultValue:.3,min:0,max:8,step:.01,section:"Glass"},dispersion:{type:ControlType.Number,title:"Dispersion",defaultValue:0,min:0,max:1,step:.01,section:"Glass"},convex:{type:ControlType.Boolean,title:"Convex",defaultValue:false,section:"Glass"},rimStrength:{type:ControlType.Number,title:"Rim",defaultValue:2,min:0,max:4,step:.01,section:"Glass"},borderStrength:{type:ControlType.Number,title:"Outline",defaultValue:1,min:0,max:1,step:.01,section:"Glass"},brightness:{type:ControlType.Number,title:"Brightness",defaultValue:1,min:.5,max:2,step:.01,section:"Filters",hiddenWhenUnset:true},contrast:{type:ControlType.Number,title:"Contrast",defaultValue:1,min:0,max:3,step:.01,section:"Filters",hiddenWhenUnset:true},saturation:{type:ControlType.Number,title:"Saturation",defaultValue:1,min:0,max:3,step:.01,section:"Filters",hiddenWhenUnset:true}}});
export const __FramerMetadata__ = {"exports":{"default":{"type":"shader","name":null,"annotations":{"framerContractVersion":"1"}},"__FramerMetadata__":{"type":"variable"}}}
//# sourceMappingURL=./LogoCrystal.map