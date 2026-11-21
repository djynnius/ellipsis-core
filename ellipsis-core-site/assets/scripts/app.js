/* Ellipsis Core landing page: Vue 3 (vendored in assets/scripts/vendor). */
(function () {
  'use strict';
  var Vue = window.Vue;

  // Copy text to the clipboard, with a fallback for pages opened from disk.
  function copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext !== false) {
        navigator.clipboard.writeText(text).catch(function () { legacyCopy(text); });
        return;
      }
    } catch (e) { /* fall through */ }
    legacyCopy(text);
  }
  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* nothing more to try */ }
    document.body.removeChild(ta);
  }

  // All page state lives here; renderVals() turns it into what the template shows.
  var ctrl = {
    state: Vue.reactive({
    tech: 'flask',
    folder: 'routes',
    routeRaw: 'business',
    soft: false,
    loading: false,
    loaded: true,
    step: 0,
    skill: 'agent',
    copied: false,
    harness: 'rocinante',
    method: 'paste',
    copiedKey: ''
    }),
    setState: function (patch) { Object.assign(this.state, patch); },
  renderVals() {
    const s = this.state;

    // ---- stack pills
    const techData = [
      { id: 'flask', label: 'Flask', color: '#F28A1E', fg: '#1F1A17', body: 'Blueprints, one per route. Every module in routes/ is registered automatically, so a new route is a new file and nothing else.', where: 'routes/*.py  ·  app.py', snippet: 'blueprint = Blueprint("business", __name__, url_prefix="/business")' },
      { id: 'sqlalchemy', label: 'SQLAlchemy', color: '#4466C0', fg: '#FFFFFF', body: 'Plain SQLAlchemy, not Flask-SQLAlchemy. Every table inherits the standard columns, which fill themselves in.', where: 'models/  ·  controllers/database.py', snippet: 'class Business(StandardColumns, Base):' },
      { id: 'alembic', label: 'Alembic', color: '#F6B81A', fg: '#1F1A17', body: 'Alembic owns the schema. Change a model, generate a migration, and upgrade. No hand-edited tables.', where: 'migration/  ·  alembic.ini', snippet: 'uv run alembic revision --autogenerate -m "add businesses"' },
      { id: 'jinja', label: 'Jinja2', color: '#649D2B', fg: '#1F1A17', body: 'One base template that every page extends, plus reusable elements like cards and navbars. A login or landing page can still be radically different.', where: 'views/base.html  ·  views/elements/', snippet: '{% extends "base.html" %}' },
      { id: 'vue', label: 'Vue', color: '#6A4CB5', fg: '#FFFFFF', body: 'Vendored in assets, so there is nothing to install. It uses [[ ]] for expressions so it never clashes with Jinja.', where: 'assets/scripts/vendor/vue.global.prod.js', snippet: 'Ellipsis.createApp({...}).mount("#app")' },
      { id: 'redis', label: 'Redis', color: '#C8361F', fg: '#FFFFFF', body: 'Sessions and caching live in Redis, so the app can run behind a load balancer. It is off by default so the scaffold runs anywhere.', where: 'controllers/cache.py  ·  .env', snippet: 'REDIS_ENABLED=true' },
      { id: 'socketio', label: 'Socket.IO', color: '#A63E8E', fg: '#FFFFFF', body: 'Baked in but commented out. Uncomment it in three places when you need real-time.', where: 'pyproject.toml  ·  app.py  ·  views/base.html', snippet: '# uncomment all three to turn it on' },
      { id: 'pytest', label: 'pytest', color: '#4466C0', fg: '#FFFFFF', body: 'Apps get unit tested, so the tests have a home from day one.', where: 'unit_tests/', snippet: 'uv run pytest' }
    ];
    const techs = techData.map((t) => {
      const sel = s.tech === t.id;
      return {
        label: t.label,
        color: t.color,
        selected: sel,
        pick: () => this.setState({ tech: t.id }),
        style: 'display:inline-flex;align-items:center;gap:10px;min-height:44px;padding:0 18px;border-radius:999px;font:500 14px/20px Inter,-apple-system,system-ui,sans-serif;box-sizing:border-box;'
          + (sel ? 'background:#1F1A17;color:#FBF8F4;border:1px solid #1F1A17;' : 'background:#FFFFFF;color:#1F1A17;border:1px solid rgba(31,26,23,0.10);')
      };
    });
    const tech = techData.find((t) => t.id === s.tech) || techData[0];

    // ---- folders and slabs (bottom to top)
    const folderData = [
      { id: 'routes', name: 'routes/', color: '#E0402A', body: 'One blueprint per file, registered automatically. A route called business is routes/business.py, and it exposes a blueprint named blueprint.', note: 'routes/home.py' },
      { id: 'views', name: 'views/', color: '#F28A1E', body: 'Jinja2 templates. A base template, an elements/ folder for reusable pieces, and one folder per route named after it.', note: 'views/base.html  ·  views/elements/' },
      { id: 'controllers', name: 'controllers/', color: '#F6B81A', body: 'Functions and classes shared across the app: loading config.yaml, the database session and the cache. No helpers or factories folder.', note: 'config.py  ·  database.py  ·  cache.py' },
      { id: 'models', name: 'models/', color: '#649D2B', body: 'SQLAlchemy models. Inherit StandardColumns for id, uuid, created_at, updated_at, created_by and updated_by.', note: 'models/base.py  ·  models/user.py' },
      { id: 'migration', name: 'migration/', color: '#4466C0', body: 'Alembic: env.py and the versions folder. Every schema change is a migration, so databases can be rebuilt anywhere.', note: 'uv run alembic upgrade head' },
      { id: 'assets', name: 'assets/', color: '#6A4CB5', body: 'Served at /assets: css, scripts, images and fonts. Vue and skeleton.js live in scripts.', note: 'css/  ·  scripts/  ·  images/  ·  fonts/' },
      { id: 'databases', name: 'databases/', color: '#A63E8E', body: 'SQLite and other .db files you want to persist. The contents are gitignored.', note: 'databases/app.db' }
    ];
    const folders = folderData.map((f) => {
      const sel = s.folder === f.id;
      return {
        name: f.name,
        color: f.color,
        selected: sel,
        pick: () => this.setState({ folder: f.id }),
        style: 'display:inline-flex;align-items:center;gap:10px;min-height:44px;padding:0 16px;border-radius:12px;box-sizing:border-box;font:500 14px/20px Inter,-apple-system,system-ui,sans-serif;'
          + (sel ? 'background:#FFFFFF;color:#1F1A17;border:2px solid ' + f.color + ';' : 'background:rgba(255,255,255,0.64);color:#1F1A17;border:1px solid rgba(31,26,23,0.10);')
      };
    });
    const folder = folderData.find((f) => f.id === s.folder) || folderData[0];
    const slabOrder = ['databases', 'assets', 'migration', 'models', 'controllers', 'views', 'routes'];
    const slabs = slabOrder.map((id, i) => {
      const sel = s.folder === id;
      const y = 470 - i * 50;
      return { x: sel ? 330 : 260, y: sel ? y - 14 : y, op: sel ? 1 : 0.55 };
    });

    // ---- routes demo
    let r = (s.routeRaw || '').toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
    if (!r) r = 'business';
    const routeCode = 'blueprint = Blueprint(\n    "' + r + '", __name__,\n    url_prefix="/' + r + '")\n\n@blueprint.get("/")\ndef index():\n    return render_template("' + r + '/index.html")';

    // ---- standard columns
    const base = [
      { name: 'id', note: 'primary key' },
      { name: 'uuid', note: 'public identifier' },
      { name: 'created_at', note: 'set on insert' },
      { name: 'updated_at', note: 'set on every update' },
      { name: 'created_by', note: 'the logged-in user' },
      { name: 'updated_by', note: 'the logged-in user' }
    ];
    const extra = [
      { name: 'deleted_at', note: 'when the row was removed' },
      { name: 'deleted_by', note: 'who removed it' }
    ];
    const columns = base.map((c, i) => ({ name: c.name, note: c.note, cls: '', bg: i % 2 ? '#FBF8F4' : '#FFFFFF' }))
      .concat(s.soft ? extra.map((c) => ({ name: c.name, note: c.note, cls: 'popin', bg: '#FDF1DF' })) : []);

    // ---- skeleton demo
    const rows = [
      { name: 'Marigold Studio', meta: 'Created by Ama · 2 min ago', initial: 'M', color: '#F28A1E', fg: '#1F1A17', delay: '0s' },
      { name: 'Orchard Labs', meta: 'Created by Kofi · 1 hr ago', initial: 'O', color: '#A63E8E', fg: '#FFFFFF', delay: '0.08s' },
      { name: 'Saffron & Co', meta: 'Created by Ama · yesterday', initial: 'S', color: '#6A4CB5', fg: '#FFFFFF', delay: '0.16s' }
    ];

    // ---- quickstart
    const stepData = [
      { cmd: 'cp .env.example .env', result: 'now set SECRET_KEY' },
      { cmd: 'uv sync', result: 'dependencies installed' },
      { cmd: 'uv run alembic upgrade head', result: 'created databases/app.db' },
      { cmd: 'uv run python app.py', result: 'serving on http://127.0.0.1:5000' }
    ];
    const steps = stepData.map((d, i) => ({
      cmd: d.cmd,
      result: d.result,
      done: i < s.step,
      bg: i === s.step ? '#FDF1DF' : '#FFFFFF',
      op: i <= s.step ? 1 : 0.5
    }));

    // ---- skill
    const agentText = 'Install the ellipsis skill for me:\n1. Clone https://github.com/djynnius/ellipsis-core.git into ~/.ellipsis (git pull if it is already there).\n2. Symlink ~/.ellipsis/skills/ellipsis into your skills directory as "ellipsis".\n3. Add export ELLIPSIS_REPO=https://github.com/djynnius/ellipsis-core.git to my shell profile.\n4. Confirm SKILL.md is readable, then tell me how to start a new ellipsis app.';
    const diyText = 'git clone https://github.com/djynnius/ellipsis-core.git ~/.ellipsis\n\n# Claude Code\nmkdir -p ~/.claude/skills\nln -sfn ~/.ellipsis/skills/ellipsis ~/.claude/skills/ellipsis\n\n# lets the skill pull the latest scaffold\necho \'export ELLIPSIS_REPO=https://github.com/djynnius/ellipsis-core.git\' >> ~/.bashrc';
    const pillStyle = (on) => 'display:inline-flex;align-items:center;min-height:44px;padding:0 18px;border-radius:999px;box-sizing:border-box;font:500 14px/20px Inter,-apple-system,system-ui,sans-serif;'
      + (on ? 'background:#1F1A17;color:#FBF8F4;border:1px solid #1F1A17;' : 'background:#FFFFFF;color:#1F1A17;border:1px solid rgba(31,26,23,0.10);');

    // ---- install section
    const repo = 'https://github.com/djynnius/ellipsis-core.git';
    const harnessData = [
      { id: 'rocinante', label: 'Rocinante', name: 'Rocinante', dir: '~/.rocinante/skills', link: true, tip: 'Rocinante reads ~/.rocinante/skills, and it also picks up ~/.claude/skills.' },
      { id: 'claude', label: 'Claude Code', name: 'Claude Code', dir: '~/.claude/skills', link: true, tip: '' },
      { id: 'antigravity', label: 'Antigravity', name: 'Antigravity', dir: '~/.gemini/config/skills', link: false, tip: 'Antigravity may not follow symlinks, so this copies the skill. Run the copy again after you update.' },
      { id: 'codex', label: 'Codex', name: 'Codex', dir: '~/.agents/skills', link: true, tip: '' },
      { id: 'other', label: 'Others', name: 'another harness', dir: '~/.agents/skills', link: true, tip: 'Most other harnesses read ~/.agents/skills. If yours uses a different folder, change the path.' }
    ];
    const hd = harnessData.find((h) => h.id === s.harness) || harnessData[0];
    const dir = hd.dir;
    const dirWords = s.harness === 'other' ? 'your own skills directory (most harnesses read ~/.agents/skills)' : dir;
    const step2 = hd.link
      ? '2. Symlink ~/.ellipsis/skills/ellipsis into ' + dirWords + ' as "ellipsis". Create the skills directory if it does not exist.\n'
      : '2. Copy ~/.ellipsis/skills/ellipsis into ' + dirWords + ' as "ellipsis". Copy it rather than symlinking, since symlinked skills may not be picked up. Create the skills directory if it does not exist.\n';
    const pasteText = 'Install the ellipsis skill for me:\n'
      + '1. Clone ' + repo + ' into ~/.ellipsis (if it is already there, run git pull in it instead).\n'
      + step2
      + '3. Add this line to my shell profile if it is not already there: export ELLIPSIS_REPO=' + repo + '\n'
      + '4. Confirm that SKILL.md is readable in the skills directory, then tell me how to start a new ellipsis app.';
    const terminalText = 'git clone ' + repo + ' ~/.ellipsis\n\n'
      + (hd.link
        ? 'mkdir -p ' + dir + ' && ln -sfn ~/.ellipsis/skills/ellipsis ' + dir + '/ellipsis\n\n'
        : 'mkdir -p ' + dir + ' && rm -rf ' + dir + '/ellipsis && cp -R ~/.ellipsis/skills/ellipsis ' + dir + '/ellipsis\n\n')
      + '# lets the skill pull the latest scaffold when it starts a new app\n'
      + 'echo \'export ELLIPSIS_REPO=' + repo + '\' >> ~/.bashrc   # or ~/.zshrc';
    const installText = s.method === 'paste' ? pasteText : terminalText;
    const harnessName = hd.name;
    const harnesses = harnessData.map((h) => ({
      label: h.label,
      selected: s.harness === h.id,
      pick: () => this.setState({ harness: h.id }),
      style: 'display:inline-flex;align-items:center;min-height:44px;padding:0 16px;border-radius:999px;box-sizing:border-box;font:500 14px/20px Inter,-apple-system,system-ui,sans-serif;'
        + (s.harness === h.id ? 'background:#1F1A17;color:#FBF8F4;border:1px solid #1F1A17;' : 'background:#FFFFFF;color:#1F1A17;border:1px solid rgba(31,26,23,0.10);')
    }));
    const copyText = (key, text) => () => {
      copyToClipboard(text);
      this.setState({ copiedKey: key });
      clearTimeout(this._t3);
      this._t3 = setTimeout(() => this.setState({ copiedKey: '' }), 1800);
    };
    const chip = (on) => 'display:inline-flex;align-items:center;min-height:44px;padding:0 16px;border-radius:999px;box-sizing:border-box;font:500 14px/20px Inter,-apple-system,system-ui,sans-serif;'
      + (on ? 'background:#1F1A17;color:#FBF8F4;border:1px solid #1F1A17;' : 'background:#FFFFFF;color:#1F1A17;border:1px solid rgba(31,26,23,0.10);');

    return {
      harnesses,
      isPaste: s.method === 'paste', isTerminal: s.method === 'terminal',
      pasteStyle: chip(s.method === 'paste'), terminalStyle: chip(s.method === 'terminal'),
      pickPaste: () => this.setState({ method: 'paste' }),
      pickTerminal: () => this.setState({ method: 'terminal' }),
      installText,
      installTitle: s.method === 'paste' ? 'Paste this into ' + harnessName : 'Run this in your terminal for ' + harnessName,
      installNote: (s.method === 'paste'
        ? 'Works in any harness that supports skills. Your agent does the cloning and linking for you.'
        : 'Same steps, run by hand. Start a new session in your harness afterwards.') + (hd.tip ? ' ' + hd.tip : ''),
      installCopyLabel: s.copiedKey === 'install' ? 'Copied' : 'Copy',
      copyInstall: copyText('install', installText),
      startCopyLabel: s.copiedKey === 'start' ? 'Copied' : 'Copy',
      copyStart: copyText('start', 'build me an ellipsis app called my-app'),
      copyLabel: s.copied ? 'Copied' : 'Copy',
      copyClone: () => {
        copyToClipboard('git clone https://github.com/djynnius/ellipsis-core.git');
        this.setState({ copied: true });
        clearTimeout(this._t2);
        this._t2 = setTimeout(() => this.setState({ copied: false }), 1800);
      },
      techs, tech,
      folders, folder,
      slab0: slabs[0], slab1: slabs[1], slab2: slabs[2], slab3: slabs[3], slab4: slabs[4], slab5: slabs[5], slab6: slabs[6],
      routeRaw: s.routeRaw,
      routeName: r,
      routeCode,
      setRoute: (e) => this.setState({ routeRaw: e.target.value }),
      columns,
      soft: s.soft,
      softLabel: s.soft ? 'Remove SoftDelete' : 'Add SoftDelete',
      toggleSoft: () => this.setState({ soft: !s.soft }),
      loading: s.loading,
      loaded: !s.loading,
      rows,
      loadLabel: s.loading ? 'Loading…' : 'Reload data',
      loadData: () => {
        if (this.state.loading) return;
        this.setState({ loading: true });
        clearTimeout(this._t1);
        this._t1 = setTimeout(() => this.setState({ loading: false }), 1800);
      },
      steps,
      stepLabel: s.step >= 4 ? 'All done' : (s.step === 0 ? 'Run step 1' : 'Run step ' + (s.step + 1)),
      stepCount: s.step + ' of 4 done',
      nextStep: () => this.setState({ step: Math.min(4, this.state.step + 1) }),
      resetSteps: () => this.setState({ step: 0 }),
      alive: s.step >= 4,
      waiting: s.step < 4,
      isAgent: s.skill === 'agent',
      isDiy: s.skill === 'diy',
      agentStyle: pillStyle(s.skill === 'agent'),
      diyStyle: pillStyle(s.skill === 'diy'),
      pickAgent: () => this.setState({ skill: 'agent' }),
      pickDiy: () => this.setState({ skill: 'diy' }),
      skillText: s.skill === 'agent' ? agentText : diyText
    };
  },
  };

  Vue.createApp({
    setup: function () {
      var vm = Vue.computed(function () { return ctrl.renderVals(); });
      return { vm: vm };
    }
  }).mount('#app');
})();
