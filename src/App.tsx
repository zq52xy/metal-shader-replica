// [PROTOCOL]: Update this header on change, then check CLAUDE.md.
// INPUT: User control changes and optional SVG/PNG replacement files.
// OUTPUT: Four original Framer shader modes with collapsible live uniform controls.
// POS: Own UI state and controls; WebGL2 rendering lives in FramerShaderCanvas.

import { useMemo, useState } from "react";
import { FramerShaderCanvas } from "./FramerShaderCanvas";
import { cloneUniforms, DEFAULT_SOURCE, DEFAULT_UNIFORMS, MODE_SPECS } from "./shaderPresets";
import type { ShaderMode, UniformMap, UniformValue } from "./types";

const sampleSvg = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">
  <path d="M153 107h490v190H431L643 503H431v190L153 420h212L153 297z" fill="white"/>
</svg>`)}`;

export default function App() {
  const [selected, setSelected] = useState<ShaderMode>("gradient");
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [source, setSource] = useState(DEFAULT_SOURCE);
  const [sourceName, setSourceName] = useState("apple-logo-trimmed.png");
  const [uniformsByMode, setUniformsByMode] = useState(DEFAULT_UNIFORMS);
  const selectedSpec = useMemo(() => MODE_SPECS.find((mode) => mode.id === selected) ?? MODE_SPECS[0], [selected]);
  const selectedUniforms = uniformsByMode[selected];

  const updateUniform = (key: string, value: UniformValue) => {
    setUniformsByMode((current) => ({
      ...current,
      [selected]: { ...current[selected], [key]: { ...current[selected][key], value } },
    }));
  };

  const updateArrayColor = (key: string, index: number, value: string) => {
    const current = selectedUniforms[key].value;
    if (!Array.isArray(current)) return;
    updateUniform(key, current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  };

  const resetMode = () => {
    setUniformsByMode((current) => ({ ...current, [selected]: cloneUniforms(selectedSpec.uniforms) }));
  };

  const resetAll = () => {
    if (source.startsWith("blob:")) URL.revokeObjectURL(source);
    setSource(DEFAULT_SOURCE);
    setSourceName("apple-logo-trimmed.png");
    setUniformsByMode(Object.fromEntries(MODE_SPECS.map((mode) => [mode.id, cloneUniforms(mode.uniforms)])) as Record<ShaderMode, UniformMap>);
  };

  const loadFile = (file: File | undefined) => {
    if (!file || !/(image\/png|image\/svg\+xml)/.test(file.type)) return;
    if (source.startsWith("blob:")) URL.revokeObjectURL(source);
    const url = URL.createObjectURL(file);
    setSource(url);
    setSourceName(file.name);
    setUniformsByMode((current) => Object.fromEntries(
      Object.entries(current).map(([mode, uniforms]) => [mode, { ...uniforms, u_image: { ...uniforms.u_image, value: url } }]),
    ) as unknown as Record<ShaderMode, UniformMap>);
  };

  const loadSampleSvg = () => {
    if (source.startsWith("blob:")) URL.revokeObjectURL(source);
    setSource(sampleSvg);
    setSourceName("sample-vector.svg");
  };

  return (
    <main className={panelCollapsed ? "app-shell is-panel-collapsed" : "app-shell"}>
      <section className="stage" aria-label="shader grid">
        {MODE_SPECS.map((mode) => (
          <FramerShaderCanvas
            active={mode.id === selected}
            key={mode.id}
            mode={mode}
            onSelect={() => setSelected(mode.id)}
            source={source}
            uniforms={uniformsByMode[mode.id]}
          />
        ))}
      </section>

      <aside className={panelCollapsed ? "control-panel is-collapsed" : "control-panel"} aria-label="shader parameters">
        <div className="panel-toolbar">
          <span className="panel-title">Parameters</span>
          <button
            aria-controls="shader-parameter-panel"
            aria-expanded={!panelCollapsed}
            aria-label={panelCollapsed ? "Expand parameter panel" : "Collapse parameter panel"}
            className="collapse-toggle"
            onClick={() => setPanelCollapsed((current) => !current)}
            type="button"
          >
            {panelCollapsed ? "<" : ">"}
          </button>
        </div>

        <div className="panel-content" hidden={panelCollapsed} id="shader-parameter-panel">
          <div className="panel-row mode-tabs">
            {MODE_SPECS.map((mode) => (
              <button className={mode.id === selected ? "tab is-active" : "tab"} key={mode.id} onClick={() => setSelected(mode.id)} type="button">
                {mode.shortLabel}
              </button>
            ))}
          </div>

          <div className="panel-section">
            <label className="file-control">
              <span>Replace SVG/PNG heightmap</span>
              <input accept=".png,.svg,image/png,image/svg+xml" onChange={(event) => loadFile(event.target.files?.[0])} type="file" />
            </label>
            <div className="source-row">
              <span title={sourceName}>{sourceName}</span>
              <button onClick={resetAll} type="button">Reset all</button>
            </div>
            <button onClick={loadSampleSvg} type="button">Sample SVG</button>
          </div>

          <div className="panel-heading">
            <h1>{selectedSpec.label}</h1>
            <button onClick={resetMode} type="button">Reset mode</button>
          </div>

          <div className="sliders">
            {Object.entries(selectedUniforms).map(([key, entry]) => {
              if (entry.type === "responsiveimage") return null;
              const meta = selectedSpec.config.propertyControls?.[key.replace(/^u_/, "")] ?? {};
              const label = String(meta.title ?? key.replace(/^u_/, ""));
              if (entry.type === "boolean") {
                return (
                  <label className="boolean-row" key={key}>
                    <span>{label}</span>
                    <input checked={Boolean(entry.value)} onChange={(event) => updateUniform(key, event.target.checked)} type="checkbox" />
                  </label>
                );
              }
              if (entry.type === "color") {
                return (
                  <label className="color-row" key={key}>
                    <span>{label}</span>
                    <input onChange={(event) => updateUniform(key, event.target.value)} type="color" value={toHex(String(entry.value))} />
                  </label>
                );
              }
              if (entry.type === "array" && Array.isArray(entry.value)) {
                return (
                  <label className="palette-row" key={key}>
                    <span>{label}</span>
                    <span className="palette-inputs">
                      {entry.value.map((item, index) => (
                        <input key={`${key}-${index}`} onChange={(event) => updateArrayColor(key, index, event.target.value)} type="color" value={toHex(String(item))} />
                      ))}
                    </span>
                  </label>
                );
              }
              return (
                <label className="slider-row" key={key}>
                  <span>{label}</span>
                  <input
                    className="number-input"
                    max={Number(meta.max ?? 20)}
                    min={Number(meta.min ?? 0)}
                    onChange={(event) => updateUniform(key, Number(event.target.value))}
                    step={Number(meta.step ?? 0.01)}
                    type="number"
                    value={Number(entry.value).toFixed(Number(meta.step ?? 0.01) < 0.01 ? 3 : 2)}
                  />
                  <input
                    max={Number(meta.max ?? 20)}
                    min={Number(meta.min ?? 0)}
                    onChange={(event) => updateUniform(key, Number(event.target.value))}
                    step={Number(meta.step ?? 0.01)}
                    type="range"
                    value={Number(entry.value)}
                  />
                </label>
              );
            })}
          </div>
        </div>
      </aside>
    </main>
  );
}

function toHex(value: string) {
  const rgb = value.match(/rgba?\(([^)]+)\)/i);
  if (!rgb) return value.startsWith("#") ? value : "#000000";
  const parts = rgb[1].split(",").slice(0, 3).map((part) => Number(part.trim()));
  return `#${parts.map((part) => Math.max(0, Math.min(255, part)).toString(16).padStart(2, "0")).join("")}`;
}
