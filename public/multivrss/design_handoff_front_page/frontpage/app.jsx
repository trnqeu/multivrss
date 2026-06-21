/* global React, window, ReactDOM */
const { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakSelect, TweakToggle } = window;
const { Sidebar, TopBar, ViewTabs, Telemetry, RiverView, FrontPage } = window;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "switchStyle": "tabs",
  "layout": "sections",
  "signal": "affinity",
  "density": "comfortable",
  "defaultView": "front"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = React.useState(t.defaultView);

  // keep view in sync if the default tweak changes
  React.useEffect(() => { setView(t.defaultView); }, [t.defaultView]);

  const switchInTabs = t.switchStyle === 'tabs';
  const topSwitch = switchInTabs ? 'none' : t.switchStyle;

  return (
    <div className={`app density-${t.density}`} data-view={view}>
      <Sidebar view={view} />
      <div className="main">
        <TopBar view={view} setView={setView} switchStyle={topSwitch} />
        {switchInTabs && <ViewTabs view={view} setView={setView} />}
        <div className="scroll">
          <Telemetry view={view} />
          <main className="content">
            {view === 'river'
              ? <RiverView />
              : <FrontPage layout={t.layout} signal={t.signal} />}
          </main>
        </div>
      </div>

      <TweaksPanel>
        <TweakSection label="View switch" />
        <TweakRadio label="Placement" value={t.switchStyle}
          options={['segmented', 'pill', 'tabs']}
          onChange={v => setTweak('switchStyle', v)} />
        <TweakRadio label="Open on" value={t.defaultView}
          options={['river', 'front']}
          onChange={v => setTweak('defaultView', v)} />

        <TweakSection label="Front Page layout" />
        <TweakRadio label="Layout" value={t.layout}
          options={['editorial', 'digest', 'sections']}
          onChange={v => setTweak('layout', v)} />

        <TweakSection label="Personalization" />
        <TweakSelect label="“Why” signal" value={t.signal}
          options={['reasons', 'affinity', 'badge', 'none']}
          onChange={v => setTweak('signal', v)} />

        <TweakSection label="Density" />
        <TweakRadio label="Density" value={t.density}
          options={['comfortable', 'compact']}
          onChange={v => setTweak('density', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
