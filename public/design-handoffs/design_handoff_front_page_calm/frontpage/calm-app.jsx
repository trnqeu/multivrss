/* global React, window, ReactDOM */
const { useTweaks, TweaksPanel, TweakSection, TweakRadio } = window;
const { CalmSidebar, CalmTopBar, CalmFrontPage } = window;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "chrome": "calm",
  "header": "oneline",
  "accent": "restrained"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  return (
    <div className="app">
      <CalmSidebar />
      <div className="main">
        <CalmTopBar />
        <div className="scroll">
          <CalmFrontPage t={t} />
        </div>
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Chrome" />
        <TweakRadio label="Per-card UI" value={t.chrome}
          options={['calm', 'busy']}
          onChange={v => setTweak('chrome', v)} />

        <TweakSection label="Masthead" />
        <TweakRadio label="Meta" value={t.header}
          options={['oneline', 'full']}
          onChange={v => setTweak('header', v)} />

        <TweakSection label="Accent" />
        <TweakRadio label="Terracotta" value={t.accent}
          options={['restrained', 'everywhere']}
          onChange={v => setTweak('accent', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
