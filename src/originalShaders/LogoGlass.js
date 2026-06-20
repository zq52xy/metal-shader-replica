import{defineShader,ControlType}from"framer";export default defineShader({title:"Logo Glass",heightmapSource:"image",fragment:`
// === PCG-BASED VALUE NOISE ===

uint pcg(uint s) {
    s = s * 747796405u + 2891336453u;
    s = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u;
    return s ^ (s >> 22u);
}

float hashVal(vec2 p) {
    uvec2 q = uvec2(floatBitsToUint(p.x), floatBitsToUint(p.y));
    return float(pcg(q.x ^ pcg(q.y))) / float(0xFFFFFFFFu);
}

float valueNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hashVal(i);
    float b = hashVal(i + vec2(1, 0));
    float c = hashVal(i + vec2(0, 1));
    float d = hashVal(i + vec2(1, 1));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// === FBM ===

float fbm(vec2 p, float lac, int oct, float pers) {
    float v = 0.0, a = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < oct; i++) {
        v += a * valueNoise(p);
        p = rot * p * lac;
        a *= pers;
    }
    return v;
}

// === DOMAIN WARPING ===

float warpedField(vec2 p, float t, float lac, int oct, float pers, float warpDepth, float mode, float dir, float seed) {

    uint s = uint(seed);
    float sx = float(pcg(s)) / float(0xFFFFFFFFu);
    float sy = float(pcg(s + 73u)) / float(0xFFFFFFFFu);
    p += (vec2(sx, sy) - 0.5) * 200.0;

    if (mode < 0.5) {
        vec2 drift = vec2(t * 0.4, -t * 0.3);
        vec2 q = vec2(
            fbm(p + drift, lac, oct, pers),
            fbm(p + vec2(5.2, 1.3) + drift.yx, lac, oct, pers)
        );
        if (warpDepth < 1.5) return fbm(p + q * 4.0, lac, oct, pers);
        vec2 r = vec2(
            fbm(p + q * 4.0 + vec2(1.7, 9.2) + drift * 0.7, lac, oct, pers),
            fbm(p + q * 4.0 + vec2(8.3, 2.8) - drift * 0.5, lac, oct, pers)
        );
        return fbm(p + r * 4.0, lac, oct, pers);
    }

    if (mode < 1.5) {
        float a = dir * 3.14159 / 180.0;
        p += vec2(cos(a), sin(a)) * t * 0.6;
    } else {
        float ang = atan(p.y, p.x);
        float rad = length(p);
        p += vec2(cos(ang + t * 0.5), sin(ang + t * 0.5)) * rad * 0.4;
    }

    vec2 drift = vec2(t * 0.15, -t * 0.2);
    vec2 q = vec2(
        fbm(p + drift, lac, oct, pers),
        fbm(p + vec2(5.2, 1.3) + drift.yx, lac, oct, pers)
    );
    if (warpDepth < 1.5) return fbm(p + q * 4.0, lac, oct, pers);
    vec2 r = vec2(
        fbm(p + q * 4.0 + vec2(1.7, 9.2) + drift * 0.7, lac, oct, pers),
        fbm(p + q * 4.0 + vec2(8.3, 2.8) - drift * 0.5, lac, oct, pers)
    );
    return fbm(p + r * 4.0, lac, oct, pers);
}

// === HEIGHTMAP HELPERS ===

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
    float eps = 4.0;
    float dR = blurDepth3x3(uv + vec2(eps * texel.x, 0.0), dudx, dudy, texel, 4.0);
    float dL = blurDepth3x3(uv - vec2(eps * texel.x, 0.0), dudx, dudy, texel, 4.0);
    float dU = blurDepth3x3(uv + vec2(0.0, eps * texel.y), dudx, dudy, texel, 4.0);
    float dD = blurDepth3x3(uv - vec2(0.0, eps * texel.y), dudx, dudy, texel, 4.0);
    return vec2(dR - dL, dU - dD) / (2.0 * eps * texel);
}

// === MAIN ===

void main() {

    vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
    vec2 texSize = vec2(textureSize(u_image_heightmap, 0));
    float imgAspect = texSize.x / texSize.y;
    float canvasAspect = u_resolution.x / u_resolution.y;

    if (canvasAspect > imgAspect) {
        uv.x = (uv.x - 0.5) * (canvasAspect / imgAspect) + 0.5;
    } else {
        uv.y = (uv.y - 0.5) * (imgAspect / canvasAspect) + 0.5;
    }

    float aaScale = max(1.0, 2.0 / u_pixelRatio);

    vec2 dudx = dFdx(uv);
    vec2 dudy = dFdy(uv);

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
    opacity *= smoothstep(0.0, 1.0 * fwidth(edgeDist), edgeDist);

    if (opacity < 0.001) {
        fragColor = vec4(u_colorBack.rgb * u_colorBack.a, u_colorBack.a);
        return;
    }

    vec2 texel = 1.0 / texSize;
    float t = mod(u_time * u_speed, 3600.0);

    float lac = u_lacunarity;
    int   oct = int(u_octaves);
    float pers = u_persistence;
    float warpD = u_warpDepth;
    float mode = u_motionMode;
    float dir = u_direction;
    float seed = u_seed;

    float depth = max(blurDepth3x3(uv, dudx, dudy, texel, 6.0), 0.001);

    vec2  grad = heightGrad(uv, dudx, dudy, texel);
    float gradMag = min(length(grad), 5.0);
    vec2  gradDir = gradMag > 0.001 ? normalize(grad) : vec2(0.0);
    vec2  contourDir = vec2(-gradDir.y, gradDir.x);

    float boundaryFade = smoothstep(0.0, 0.05, depth);

    float falloffNorm = clamp(u_falloff / 20.0, 0.0, 1.0);
    float lensExp = mix(0.3, 3.0, falloffNorm);
    float lens = pow(clamp(depth, 0.0, 1.0), lensExp);
    float glass = smoothstep(0.0, 0.05, depth) * lens;

    float edgeShape = (1.0 - lens) * boundaryFade;

    float edgeFactor = smoothstep(0.0, 0.5, gradMag * u_contour * 2.0) * glass * boundaryFade;
    float contourMod = u_contour * boundaryFade;

    float lightAng = u_lightAngle * 3.14159 / 180.0;
    vec2 lightDir = vec2(cos(lightAng), sin(lightAng));

    vec2 p = (uv - 0.5) * 2.0;
    p.x *= imgAspect;
    p.y = -p.y;

    // === SHAPE-AWARE COORDINATE WARPING (independent from glass contour) ===
    float edgeProximity = 1.0 - smoothstep(0.0, 0.8, depth);
    float innerIntensity = smoothstep(0.0, 0.4, depth);

    p += contourDir * edgeProximity * u_bend * 2.0;
    p -= gradDir * edgeProximity * u_bend * 0.5;
    p *= max(0.5, mix(1.0, 0.4 + 0.6 * smoothstep(0.0, 0.5, depth), u_shapeContour));

    float warpMix = glass * u_warp;
    float baseLens = sqrt(max(glass, 0.001) / 0.3);

    float iorBase = mix(1.2, 2.5, u_ior);
    float dispCoeff = u_dispersion * 0.2;
    float dispIntensity = u_dispersion * 3.0;
    vec3 wavelengths = vec3(0.65, 0.55, 0.45);

    float ns = u_scale * 3.0;

    // === PER-PIXEL GRAIN ===
    vec2 noiseCoord = v_uv * u_resolution;
    uint grainHash = pcg(uint(noiseCoord.x) * 1933u ^ uint(noiseCoord.y) * 7919u);
    float grain = 1.0 + (float(grainHash) / float(0xFFFFFFFFu) - 0.5) * u_noise;

    vec3 vDispersed = vec3(0.0);

    for (int c = 0; c < 3; c++) {
        vec2 pp = p;

        float wl = wavelengths[c];
        float ior = iorBase + dispCoeff / (wl * wl);
        float iorMid = iorBase + dispCoeff / 0.3025;

        float lensScale = mix(1.0, ior / iorMid, edgeFactor);

        pp = mix(pp, pp * baseLens * lensScale, warpMix);

        pp *= max(0.35, 0.1 + (1.1 - edgeShape) * (1.0 - 0.5 * edgeShape));
        pp -= gradDir * edgeShape * contourMod * 2.0;
        pp *= max(0.5, mix(1.0, 1.0 - edgeShape, smoothstep(0.5, 1.0, contourMod)));

        vDispersed[c] = warpedField(pp * ns, t, lac, oct, pers, warpD, mode, dir, seed) * grain;
    }

    // === SHAPE CONTOUR VALUE MODULATION ===
    float contourHeat = (1.0 - innerIntensity) * u_shapeContour;
    for (int c = 0; c < 3; c++) {
        vDispersed[c] = mix(vDispersed[c], vDispersed[c] * innerIntensity + contourHeat, 0.5 + 0.5 * u_shapeContour);
    }

    vec2 ppRef = p;
    ppRef = mix(ppRef, ppRef * baseLens, warpMix);
    ppRef *= max(0.35, 0.1 + (1.1 - edgeShape) * (1.0 - 0.5 * edgeShape));
    ppRef -= gradDir * edgeShape * contourMod * 2.0;
    ppRef *= max(0.5, mix(1.0, 1.0 - edgeShape, smoothstep(0.5, 1.0, contourMod)));

    float n = vDispersed.g;

    float eps = 0.8 / u_bumpDist;
    float nR = warpedField((ppRef + vec2(eps, 0.0)) * ns, t, lac, oct, pers, warpD, mode, dir, seed);
    float nU = warpedField((ppRef + vec2(0.0, eps)) * ns, t, lac, oct, pers, warpD, mode, dir, seed);
    vec2 fieldGrad = vec2(nR - n, nU - n) / eps;

    float diffuse = dot(fieldGrad, lightDir);
    float highlight = max(diffuse, 0.0);
    float shadow = max(-diffuse, 0.0);
    highlight = highlight * highlight * 0.15 + pow(highlight, 4.0) * 0.05;
    shadow = shadow * shadow * 0.1 + pow(shadow, 4.0) * 0.03;

    float nLift = mix(0.3, 1.0, n);
    float nSq = nLift * nLift;
    vec3 chromaDiff = vDispersed - n;

    vec3 hiCol = u_colorHighlight.rgb;
    vec3 shCol = u_colorShadow.rgb;

    float bumpFade = smoothstep(0.0, 1.0, depth);
    vec3 col = nSq * (hiCol * highlight * u_bumpStrength * bumpFade
         + shCol * shadow * u_bumpStrength * bumpFade
         + 0.5);

    col += chromaDiff * dispIntensity * edgeFactor * 0.5;

    vec3 tintLo = u_colorA.rgb;
    vec3 tintHi = u_colorB.rgb;
    col = mix(tintLo, tintHi, col);

    col += u_ambient;

    // Exposure in linear space
    col *= 2.0 * u_brightness;

    // Gamma
    col = sqrt(max(col, 0.0));

    // Contrast + saturation in sRGB (cheap, good enough)
    col = (col - 0.5) * u_contrast + 0.5;
    float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
    col = mix(vec3(lum), col, u_saturation);
    col = clamp(col, 0.0, 1.0);

    col *= opacity;
    vec3 bgColor = u_colorBack.rgb * u_colorBack.a;
    col = col + bgColor * (1.0 - opacity);
    float finalAlpha = opacity + u_colorBack.a * (1.0 - opacity);

    fragColor = vec4(col, finalAlpha);
}
`,propertyControls:{image:{type:ControlType.ResponsiveImage,title:"Image",defaultValue:"data:framer/asset-reference,7XHsXmlUUmdQM95fkSvi3LRCuSk.svg?originalFilename=Path.svg&width=32&height=48"},colorBack:{type:ControlType.Color,title:"Background",defaultValue:"#000000"},colorA:{type:ControlType.Color,title:"Color Low",defaultValue:"#000000",hidden:true},colorB:{type:ControlType.Color,title:"Tint",defaultValue:"#C9C9C9"},colorHighlight:{type:ControlType.Color,title:"Highlight",defaultValue:"#FFFFFF",hidden:true},colorShadow:{type:ControlType.Color,title:"Shadow",defaultValue:"#333333",hidden:true},seed:{type:ControlType.Number,title:"Seed",defaultValue:55,min:0,max:100,step:1},speed:{type:ControlType.Number,title:"Speed",defaultValue:.3,min:0,max:2,step:.01},scale:{type:ControlType.Number,title:"Scale",defaultValue:.2,min:.1,max:1,step:.01},motionMode:{type:ControlType.Enum,title:"Motion",defaultValue:0,options:[0,1],optionTitles:["Free","Melt"]},direction:{type:ControlType.Number,title:"Direction",defaultValue:0,min:0,max:360,step:1,hidden:props=>props.motionMode===0},octaves:{type:ControlType.Number,title:"Octaves",defaultValue:3,min:1,max:6,step:1,displayStepper:true},persistence:{type:ControlType.Number,title:"Persistence",defaultValue:.65,min:0,max:1,step:.01},lacunarity:{type:ControlType.Number,title:"Lacunarity",defaultValue:1.7,min:1.2,max:3,step:.1},warpDepth:{type:ControlType.Number,title:"Warp Depth",defaultValue:2,min:1,max:2,step:1,displayStepper:true},warp:{type:ControlType.Number,title:"Lens Warp",defaultValue:.5,min:0,max:1,step:.01,section:"Glass"},ior:{type:ControlType.Number,title:"IOR",defaultValue:.5,min:0,max:1,step:.01,section:"Glass",hidden:true},dispersion:{type:ControlType.Number,title:"Dispersion",defaultValue:0,min:0,max:2,step:.01,section:"Glass"},contour:{type:ControlType.Number,title:"Contour",defaultValue:.05,min:0,max:1,step:.01,section:"Glass",hidden:true},falloff:{type:ControlType.Number,title:"Bevel",defaultValue:2,min:0,max:20,step:.01,section:"Glass",hidden:false},shapeContour:{type:ControlType.Number,title:"Contour",defaultValue:.7,min:0,max:1,step:.01,section:"Glass"},bend:{type:ControlType.Number,title:"Bend",defaultValue:.65,min:0,max:1,step:.01,section:"Glass"},noise:{type:ControlType.Number,title:"Noise",defaultValue:0,min:0,max:.5,step:.01,section:"Glass"},bumpStrength:{type:ControlType.Number,title:"Lights",defaultValue:.7,min:0,max:1,step:.01,section:"Lighting"},bumpDist:{type:ControlType.Number,title:"Details",defaultValue:10,min:.5,max:20,step:.1,section:"Lighting"},lightAngle:{type:ControlType.Number,title:"Angle",defaultValue:200,min:0,max:360,step:1,section:"Lighting"},ambient:{type:ControlType.Number,title:"Ambient",defaultValue:0,min:0,max:.2,step:.01,section:"Filters",hiddenWhenUnset:true},brightness:{type:ControlType.Number,title:"Brightness",defaultValue:.7,min:.1,max:2,step:.01,section:"Filters",hiddenWhenUnset:true},contrast:{type:ControlType.Number,title:"Contrast",defaultValue:3,min:.5,max:4,step:.01,section:"Filters",hiddenWhenUnset:true},saturation:{type:ControlType.Number,title:"Saturation",defaultValue:1,min:0,max:4,step:.01,section:"Filters",hiddenWhenUnset:true}}});
export const __FramerMetadata__ = {"exports":{"default":{"type":"shader","name":null,"annotations":{"framerContractVersion":"1"}},"__FramerMetadata__":{"type":"variable"}}}
//# sourceMappingURL=./LogoGlass.map