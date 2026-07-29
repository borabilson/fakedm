var __plugin = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/index.tsx
  var index_exports = {};
  __export(index_exports, {
    default: () => index_default
  });
  var import_react = __toESM(__require("react"));
  var import_react_native = __require("react-native");
  var import_metro = __require("@vendetta/metro");
  var import_common = __require("@vendetta/metro/common");
  var import_plugin = __require("@vendetta/plugin");
  var import_toasts = __require("@vendetta/ui/toasts");
  var UserStore = (0, import_metro.findByStoreLazy)("UserStore");
  var SelectedChannelStore = (0, import_metro.findByStoreLazy)("SelectedChannelStore");
  var ChannelStore = (0, import_metro.findByStoreLazy)("ChannelStore");
  import_plugin.storage.fakes ??= [];
  var _idCounter = 0;
  function uniqueSnowflake(date) {
    const offset = _idCounter++ % 4096;
    const ms = Math.max(0, date.getTime() - 14200704e5);
    return (BigInt(ms) << 22n | BigInt(offset)).toString();
  }
  function randomSeconds(date) {
    const sec = 1 + Math.floor(Math.random() * 59);
    return new Date(date.getTime() + sec * 1e3);
  }
  var fakeIds = /* @__PURE__ */ new Map();
  function registerFake(channelId, id) {
    if (!fakeIds.has(channelId)) fakeIds.set(channelId, /* @__PURE__ */ new Set());
    fakeIds.get(channelId).add(id);
  }
  function removePersisted(channelId, ids) {
    import_plugin.storage.fakes = import_plugin.storage.fakes.filter(
      (f) => !(f.channelId === channelId && ids.has(f.snowflakeId))
    );
  }
  function clearFakes(channelId) {
    const ids = fakeIds.get(channelId);
    if (!ids?.size) return 0;
    let count = 0;
    for (const id of ids) {
      import_common.FluxDispatcher.dispatch({ type: "MESSAGE_DELETE", channelId, id, mlDeleted: true });
      count++;
    }
    removePersisted(channelId, ids);
    ids.clear();
    return count;
  }
  function getCurrentDMChannel() {
    try {
      const chId = SelectedChannelStore.getChannelId();
      if (!chId) return null;
      const ch = ChannelStore.getChannel(chId);
      if (!ch || ch.type !== 1 && ch.type !== 3) return null;
      return ch;
    } catch {
      return null;
    }
  }
  function getOtherUser() {
    try {
      const ch = getCurrentDMChannel();
      if (!ch || ch.type !== 1) return null;
      const me = UserStore.getCurrentUser();
      const otherId = ch.recipients?.find((id) => id !== me?.id);
      return otherId ? UserStore.getUser(otherId) ?? null : null;
    } catch {
      return null;
    }
  }
  function getChannelMembers() {
    try {
      const ch = getCurrentDMChannel();
      if (!ch) return [];
      const me = UserStore.getCurrentUser();
      const ids = ch.recipients ?? ch.rawRecipients?.map((r) => r.id) ?? [];
      const members = [];
      if (me) members.push(me);
      for (const id of ids) {
        if (id === me?.id) continue;
        const u = UserStore.getUser(id);
        if (u) members.push(u);
      }
      return members;
    } catch {
      return [];
    }
  }
  function avatarUrl(user) {
    if (!user) return "https://cdn.discordapp.com/embed/avatars/0.png";
    if (user.avatar) return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp?size=64`;
    const idx = user.discriminator && user.discriminator !== "0" ? parseInt(user.discriminator) % 5 : Number(BigInt(user.id) >> 22n) % 6;
    return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
  }
  function buildAuthor(user) {
    return {
      id: user.id,
      username: user.username,
      discriminator: user.discriminator ?? "0",
      avatar: user.avatar ?? null,
      public_flags: user.publicFlags ?? 0,
      flags: user.flags ?? 0,
      global_name: user.globalName ?? user.username
    };
  }
  function inject(channelId, author, content, date, persistedId) {
    const actualDate = persistedId ? date : randomSeconds(date);
    const id = persistedId ?? uniqueSnowflake(actualDate);
    import_common.FluxDispatcher.dispatch({
      type: "MESSAGE_CREATE",
      channelId,
      message: {
        attachments: [],
        components: [],
        embeds: [],
        mention_roles: [],
        mentions: [],
        author: buildAuthor(author),
        channel_id: channelId,
        content,
        edited_timestamp: null,
        flags: 0,
        id,
        mention_everyone: false,
        nonce: id,
        pinned: false,
        timestamp: actualDate.toISOString(),
        tts: false,
        type: 0
      },
      optimistic: false,
      isPushNotification: false
    });
    registerFake(channelId, id);
    if (!persistedId) {
      import_plugin.storage.fakes.push({
        type: "message",
        channelId,
        authorId: author.id,
        content,
        timestamp: actualDate.toISOString(),
        snowflakeId: id
      });
    }
  }
  function injectCall(channelId, caller, other, missed, durationSec, date, persistedId, persistedEndedTs) {
    const actualDate = persistedId ? date : randomSeconds(date);
    const id = persistedId ?? uniqueSnowflake(actualDate);
    const participants = missed ? [caller.id] : [caller.id, other.id];
    const endedDate = missed ? actualDate : persistedEndedTs ? new Date(persistedEndedTs) : new Date(actualDate.getTime() + durationSec * 1e3);
    import_common.FluxDispatcher.dispatch({
      type: "MESSAGE_CREATE",
      channelId,
      message: {
        attachments: [],
        components: [],
        embeds: [],
        mention_roles: [],
        mentions: [],
        author: buildAuthor(caller),
        channel_id: channelId,
        content: "",
        edited_timestamp: null,
        flags: 0,
        id,
        mention_everyone: false,
        nonce: id,
        pinned: false,
        timestamp: actualDate.toISOString(),
        tts: false,
        type: 3,
        call: {
          participants,
          ended_timestamp: endedDate.toISOString(),
          duration: missed ? void 0 : durationSec
        }
      },
      optimistic: false,
      isPushNotification: false
    });
    registerFake(channelId, id);
    if (!persistedId) {
      import_plugin.storage.fakes.push({
        type: "call",
        channelId,
        callerId: caller.id,
        otherId: other.id,
        missed,
        durationSec,
        timestamp: actualDate.toISOString(),
        endedTimestamp: endedDate.toISOString(),
        snowflakeId: id
      });
    }
  }
  function doRestore() {
    const fakes = import_plugin.storage.fakes;
    if (!fakes || !fakes.length) return;
    for (const f of fakes) {
      if (f.type === "message") {
        const author = UserStore.getUser(f.authorId);
        if (!author) continue;
        inject(f.channelId, author, f.content, new Date(f.timestamp), f.snowflakeId);
      } else {
        const caller = UserStore.getUser(f.callerId);
        const other = UserStore.getUser(f.otherId);
        if (!caller || !other) continue;
        injectCall(
          f.channelId,
          caller,
          other,
          f.missed,
          f.durationSec,
          new Date(f.timestamp),
          f.snowflakeId,
          f.endedTimestamp
        );
      }
    }
  }
  function toLocal(d) {
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  function FakeDMModal({ visible, onClose }) {
    const me = UserStore.getCurrentUser();
    const ch = getCurrentDMChannel();
    const channelId = SelectedChannelStore.getChannelId();
    const isGroup = ch?.type === 3;
    const other = getOtherUser();
    const members = getChannelMembers();
    const isInDMOrGroup = !!ch;
    const [mode, setMode] = (0, import_react.useState)("message");
    const [senderId, setSenderId] = (0, import_react.useState)(() => me?.id ?? "");
    const [callerId, setCallerId] = (0, import_react.useState)(() => me?.id ?? "");
    const [callReceiverId, setCallReceiverId] = (0, import_react.useState)(() => members.find((m) => m.id !== me?.id)?.id ?? me?.id ?? "");
    const [callMissed, setCallMissed] = (0, import_react.useState)(false);
    const [callDuration, setCallDuration] = (0, import_react.useState)("5");
    const [text, setText] = (0, import_react.useState)("");
    const [dateStr, setDateStr] = (0, import_react.useState)(() => toLocal(/* @__PURE__ */ new Date()));
    const meName = me?.globalName || me?.username || "Eu";
    const otherName = other?.globalName || other?.username || "Outro";
    function send() {
      if (!text.trim() || !channelId) return;
      const author = members.find((m) => m.id === senderId) ?? me;
      if (!author) return;
      const date = new Date(dateStr.replace(" ", "T"));
      if (isNaN(date.getTime())) {
        (0, import_toasts.showToast)("Data inv\xE1lida! Use AAAA-MM-DD HH:MM");
        return;
      }
      inject(channelId, author, text.trim(), date);
      setText("");
      (0, import_toasts.showToast)("Mensagem injetada com sucesso!");
      setDateStr(toLocal(new Date(date.getTime() + 6e4)));
    }
    function sendCall() {
      if (!channelId) return;
      const callerUser = members.find((m) => m.id === callerId);
      const receiverUser = members.find((m) => m.id === callReceiverId);
      if (!callerUser || !receiverUser) return;
      const date = new Date(dateStr.replace(" ", "T"));
      if (isNaN(date.getTime())) {
        (0, import_toasts.showToast)("Data inv\xE1lida!");
        return;
      }
      const durSec = callMissed ? 0 : Math.max(1, Math.round((parseFloat(callDuration) || 0) * 60));
      injectCall(channelId, callerUser, receiverUser, callMissed, durSec, date);
      (0, import_toasts.showToast)(callMissed ? "Chamada perdida injetada!" : "Chamada injetada!");
      setDateStr(toLocal(new Date(date.getTime() + 6e4)));
    }
    return /* @__PURE__ */ import_react.default.createElement(import_react_native.Modal, { visible, transparent: true, animationType: "slide", onRequestClose: onClose }, /* @__PURE__ */ import_react.default.createElement(import_react_native.SafeAreaView, { style: styles.overlay }, /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.container }, /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.header }, /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.title }, mode === "message" ? "\u270F Fake DM" : "\u{1F4DE} Fake Call", " ", isGroup ? "(Grupo)" : ""), /* @__PURE__ */ import_react.default.createElement(import_react_native.TouchableOpacity, { onPress: onClose, style: styles.closeBtn }, /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.closeTxt }, "\u2715"))), /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.tabs }, /* @__PURE__ */ import_react.default.createElement(
      import_react_native.TouchableOpacity,
      {
        style: [styles.tab, mode === "message" && styles.activeTab],
        onPress: () => setMode("message")
      },
      /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: [styles.tabTxt, mode === "message" && styles.activeTabTxt] }, "\u{1F4AC} Mensagem")
    ), /* @__PURE__ */ import_react.default.createElement(
      import_react_native.TouchableOpacity,
      {
        style: [styles.tab, mode === "call" && styles.activeTab],
        onPress: () => setMode("call")
      },
      /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: [styles.tabTxt, mode === "call" && styles.activeTabTxt] }, "\u{1F4DE} Chamada")
    )), !isInDMOrGroup ? /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.body }, /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.warning }, "Abra uma DM ou Grupo de DM para usar o FakeDM.")) : /* @__PURE__ */ import_react.default.createElement(import_react_native.ScrollView, { style: styles.body }, /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.label }, "Quem envia:"), /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.row }, /* @__PURE__ */ import_react.default.createElement(
      import_react_native.TouchableOpacity,
      {
        style: [styles.senderBtn, (mode === "message" ? senderId === me?.id : callerId === me?.id) && styles.activeSender],
        onPress: () => mode === "message" ? setSenderId(me?.id ?? "") : setCallerId(me?.id ?? "")
      },
      /* @__PURE__ */ import_react.default.createElement(import_react_native.Image, { source: { uri: avatarUrl(me) }, style: styles.avatar }),
      /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.senderTxt }, meName)
    ), /* @__PURE__ */ import_react.default.createElement(
      import_react_native.TouchableOpacity,
      {
        style: [styles.senderBtn, (mode === "message" ? senderId !== me?.id : callerId !== me?.id) && styles.activeSender],
        onPress: () => mode === "message" ? setSenderId(other?.id ?? "") : setCallerId(other?.id ?? "")
      },
      /* @__PURE__ */ import_react.default.createElement(import_react_native.Image, { source: { uri: avatarUrl(other) }, style: styles.avatar }),
      /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.senderTxt }, otherName)
    )), /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.label }, "Data & Hora (AAAA-MM-DD HH:MM):"), /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.row }, /* @__PURE__ */ import_react.default.createElement(
      import_react_native.TextInput,
      {
        style: [styles.input, { flex: 1 }],
        value: dateStr,
        onChangeText: setDateStr,
        placeholder: "2026-07-28 22:30",
        placeholderTextColor: "#72767d"
      }
    ), /* @__PURE__ */ import_react.default.createElement(import_react_native.TouchableOpacity, { style: styles.nowBtn, onPress: () => setDateStr(toLocal(/* @__PURE__ */ new Date())) }, /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.nowTxt }, "Agora"))), mode === "message" ? /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.label }, "Conte\xFAdo da Mensagem:"), /* @__PURE__ */ import_react.default.createElement(
      import_react_native.TextInput,
      {
        style: [styles.input, styles.textArea],
        multiline: true,
        numberOfLines: 3,
        placeholder: "Digite a mensagem falsa...",
        placeholderTextColor: "#72767d",
        value: text,
        onChangeText: setText
      }
    ), /* @__PURE__ */ import_react.default.createElement(import_react_native.TouchableOpacity, { style: styles.sendBtn, onPress: send }, /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.sendTxt }, "Injetar Mensagem"))) : /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.label }, "Status da Chamada:"), /* @__PURE__ */ import_react.default.createElement(import_react_native.View, { style: styles.row }, /* @__PURE__ */ import_react.default.createElement(
      import_react_native.TouchableOpacity,
      {
        style: [styles.statusBtn, !callMissed && { backgroundColor: "#3ba55c" }],
        onPress: () => setCallMissed(false)
      },
      /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.statusTxt }, "Atendida")
    ), /* @__PURE__ */ import_react.default.createElement(
      import_react_native.TouchableOpacity,
      {
        style: [styles.statusBtn, callMissed && { backgroundColor: "#ed4245" }],
        onPress: () => setCallMissed(true)
      },
      /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.statusTxt }, "Perdida")
    )), !callMissed && /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.label }, "Dura\xE7\xE3o (em minutos):"), /* @__PURE__ */ import_react.default.createElement(
      import_react_native.TextInput,
      {
        style: styles.input,
        keyboardType: "numeric",
        value: callDuration,
        onChangeText: setCallDuration
      }
    )), /* @__PURE__ */ import_react.default.createElement(import_react_native.TouchableOpacity, { style: styles.sendBtn, onPress: sendCall }, /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.sendTxt }, "Injetar Chamada"))), /* @__PURE__ */ import_react.default.createElement(
      import_react_native.TouchableOpacity,
      {
        style: styles.clearBtn,
        onPress: () => {
          if (!channelId) return;
          const n = clearFakes(channelId);
          (0, import_toasts.showToast)(`${n} mensagem(ns) falsa(s) removida(s)!`);
        }
      },
      /* @__PURE__ */ import_react.default.createElement(import_react_native.Text, { style: styles.clearTxt }, "\u{1F5D1} Limpar Falsas do Chat")
    )))));
  }
  var styles = import_react_native.StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
    container: { width: "90%", maxHeight: "80%", backgroundColor: "#2b2d31", borderRadius: 12, overflow: "hidden" },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
    title: { color: "#fff", fontSize: 16, fontWeight: "bold" },
    closeBtn: { padding: 4 },
    closeTxt: { color: "#b5bac1", fontSize: 18 },
    tabs: { flexDirection: "row", padding: 10, gap: 8 },
    tab: { flex: 1, paddingVertical: 8, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center" },
    activeTab: { backgroundColor: "#5865f2" },
    tabTxt: { color: "#b5bac1", fontSize: 13, fontWeight: "600" },
    activeTabTxt: { color: "#fff" },
    body: { padding: 14 },
    warning: { color: "#b5bac1", textAlign: "center", marginVertical: 20 },
    label: { color: "#b5bac1", fontSize: 12, fontWeight: "600", marginTop: 10, marginBottom: 6 },
    row: { flexDirection: "row", gap: 8, alignItems: "center" },
    senderBtn: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.03)" },
    activeSender: { borderColor: "#5865f2", backgroundColor: "rgba(88,101,242,0.15)" },
    avatar: { width: 24, height: 24, borderRadius: 12 },
    senderTxt: { color: "#fff", fontSize: 13, fontWeight: "500" },
    input: { backgroundColor: "#1e1f22", borderRadius: 6, borderColor: "rgba(255,255,255,0.1)", borderWidth: 1, color: "#fff", padding: 8, fontSize: 13 },
    textArea: { height: 70, textAlignVertical: "top" },
    nowBtn: { backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 6 },
    nowTxt: { color: "#fff", fontSize: 12, fontWeight: "600" },
    statusBtn: { flex: 1, paddingVertical: 8, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center" },
    statusTxt: { color: "#fff", fontSize: 12, fontWeight: "600" },
    sendBtn: { backgroundColor: "#5865f2", borderRadius: 8, paddingVertical: 12, alignItems: "center", marginTop: 16 },
    sendTxt: { color: "#fff", fontSize: 14, fontWeight: "bold" },
    clearBtn: { backgroundColor: "rgba(237,66,69,0.15)", borderRadius: 8, paddingVertical: 10, alignItems: "center", marginTop: 12, marginBottom: 20 },
    clearTxt: { color: "#ed4245", fontSize: 12, fontWeight: "bold" }
  });
  var index_default = {
    onLoad: () => {
      doRestore();
      console.log("[FakeDM] Plugin carregado no Kettu!");
    },
    onUnload: () => {
      fakeIds.clear();
      _idCounter = 0;
    },
    settings: () => {
      const [show, setShow] = (0, import_react.useState)(true);
      return /* @__PURE__ */ import_react.default.createElement(FakeDMModal, { visible: show, onClose: () => setShow(false) });
    }
  };
  return __toCommonJS(index_exports);
})();
__plugin.default || __plugin;
