// == Macro Hub Frontend Extension ==
// Assumes window.app & global graph objects are available.

(function() {
  const EXT_NAME = "MacroShortcuts";

  function getAllNodeParamCandidates() {
    const nodes = app.graph._nodes;
    const out = [];
    for (const n of nodes) {
      if (!n.widgets) continue;
      for (const w of n.widgets) {
        // Filter only modifiable widgets (slider, combo, text, etc.)
        if (["number","combo","text","checkbox"].includes(w.type) || w.options?.values) {
          out.push({
            node_id: n.id,
            node_title: n.title,
            widget_name: w.name,
            widget_type: w.type,
          });
        }
      }
    }
    return out;
  }

  function ensureMacroPanel(node, container) {
    if (node.__macroPanelInitialized) return;
    node.__macroPanelInitialized = true;

    const panel = document.createElement("div");
    panel.className = "macro-hub-panel";
    panel.style.padding = "8px";
    panel.style.borderTop = "1px solid #444";
    panel.style.fontSize = "12px";

    const heading = document.createElement("h3");
    heading.textContent = "Macros";
    heading.style.margin = "4px 0 8px 0";
    panel.appendChild(heading);

    const listDiv = document.createElement("div");
    listDiv.style.maxHeight = "180px";
    listDiv.style.overflowY = "auto";
    listDiv.style.marginBottom = "8px";
    panel.appendChild(listDiv);

    const addButton = document.createElement("button");
    addButton.textContent = "Add Macro";
    addButton.style.width = "100%";
    addButton.onclick = () => openMacroEditor(node, null, listDiv);
    panel.appendChild(addButton);

    container.appendChild(panel);

    function refreshList() {
      listDiv.innerHTML = "";
      let macros = readMacrosFromNode(node);
      if (!macros.length) {
        listDiv.innerHTML = "<em>No macros defined.</em>";
        return;
      }
      macros.forEach(m => {
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.justifyContent = "space-between";
        row.style.alignItems = "center";
        row.style.marginBottom = "4px";
        row.style.gap = "4px";

        const label = document.createElement("div");
        label.textContent = `${m.label || "(unnamed)"} → ${m.target_node_id}:${m.target_param}`;
        label.style.flex = "1";
        row.appendChild(label);

        const hk = document.createElement("code");
        hk.textContent = m.hotkey || "";
        hk.style.opacity = "0.7";
        row.appendChild(hk);

        const editBtn = document.createElement("button");
        editBtn.textContent = "E";
        editBtn.style.padding = "2px 4px";
        editBtn.onclick = () => openMacroEditor(node, m, listDiv);
        row.appendChild(editBtn);

        const delBtn = document.createElement("button");
        delBtn.textContent = "X";
        delBtn.style.padding = "2px 4px";
        delBtn.onclick = () => {
          macros = macros.filter(x => x.id !== m.id);
          writeMacrosToNode(node, macros);
          refreshList();
        };
        row.appendChild(delBtn);

        listDiv.appendChild(row);
      });
    }

    function openMacroEditor(node, macro, listDiv) {
      const modal = document.createElement("div");
      modal.style.position = "fixed";
      modal.style.top = "0";
      modal.style.left = "0";
      modal.style.width = "100vw";
      modal.style.height = "100vh";
      modal.style.background = "rgba(0,0,0,0.6)";
      modal.style.display = "flex";
      modal.style.alignItems = "center";
      modal.style.justifyContent = "center";
      modal.style.zIndex = "10000";

      const card = document.createElement("div");
      card.style.background = "#222";
      card.style.padding = "16px";
      card.style.width = "420px";
      card.style.maxHeight = "80vh";
      card.style.overflowY = "auto";
      card.style.border = "1px solid #555";
      card.style.borderRadius = "6px";
      card.style.fontSize = "12px";
      modal.appendChild(card);

      const title = document.createElement("h3");
      title.textContent = macro ? "Edit Macro" : "New Macro";
      card.appendChild(title);

      const macros = readMacrosFromNode(node);
      const candidates = getAllNodeParamCandidates();

      function field(labelText, inputEl) {
        const wrap = document.createElement("div");
        wrap.style.marginBottom = "8px";
        const lab = document.createElement("label");
        lab.textContent = labelText;
        lab.style.display = "block";
        lab.style.marginBottom = "2px";
        wrap.appendChild(lab);
        wrap.appendChild(inputEl);
        card.appendChild(wrap);
      }

      // Label
      const labelInput = document.createElement("input");
      labelInput.type = "text";
      labelInput.value = macro?.label || "";
      field("Label", labelInput);

      // Mode
      const modeSelect = document.createElement("select");
      ["jump","set_static","toggle","preset_cycle"].forEach(m => {
        const opt = document.createElement("option");
        opt.value = m;
        opt.textContent = m;
        if (macro?.mode === m) opt.selected = true;
        modeSelect.appendChild(opt);
      });
      field("Mode", modeSelect);

      // Node/Param picker
      const targetSelect = document.createElement("select");
      candidates.forEach(c => {
        const opt = document.createElement("option");
        opt.value = `${c.node_id}||${c.widget_name}`;
        opt.textContent = `[${c.node_id}] ${c.node_title} :: ${c.widget_name}`;
        if (macro && macro.target_node_id === c.node_id && macro.target_param === c.widget_name) {
            opt.selected = true;
        }
        targetSelect.appendChild(opt);
      });
      field("Target Parameter", targetSelect);

      // Value / presets
      const valueInput = document.createElement("textarea");
      valueInput.placeholder = "For set_static: single value.\\nFor preset_cycle: JSON array of values.\\nIgnored for jump.";
      valueInput.style.width = "100%";
      valueInput.style.height = "60px";
      valueInput.value = macro?.raw_value || "";
      field("Value / Presets", valueInput);

      // Hotkey
      const hotkeyInput = document.createElement("input");
      hotkeyInput.type = "text";
      hotkeyInput.placeholder = "e.g. Alt+1";
      hotkeyInput.value = macro?.hotkey || "";
      field("Hotkey", hotkeyInput);

      // Active
      const activeCheckbox = document.createElement("input");
      activeCheckbox.type = "checkbox";
      activeCheckbox.checked = macro?.active ?? true;
      field("Active", activeCheckbox);

      // Buttons
      const btnRow = document.createElement("div");
      btnRow.style.display = "flex";
      btnRow.style.gap = "8px";
      btnRow.style.justifyContent = "flex-end";
      card.appendChild(btnRow);

      const cancelBtn = document.createElement("button");
      cancelBtn.textContent = "Cancel";
      cancelBtn.onclick = () => document.body.removeChild(modal);
      btnRow.appendChild(cancelBtn);

      const saveBtn = document.createElement("button");
      saveBtn.textContent = "Save";
      saveBtn.onclick = () => {
        const [nidStr, param] = targetSelect.value.split("||");
        const newMacro = {
          id: macro?.id || crypto.randomUUID(),
          label: labelInput.value.trim(),
          mode: modeSelect.value,
          target_node_id: Number(nidStr),
          target_param: param,
          raw_value: valueInput.value,
          hotkey: hotkeyInput.value.trim(),
          active: activeCheckbox.checked
        };
        // Insert/update
        const idx = macros.findIndex(m => m.id === newMacro.id);
        if (idx >= 0) macros[idx] = newMacro; else macros.push(newMacro);
        writeMacrosToNode(node, macros);
        refreshList();
        registerAllHotkeys(macros);
        document.body.removeChild(modal);
      };
      btnRow.appendChild(saveBtn);

      document.body.appendChild(modal);
    }

    node.__refreshMacroList = refreshList;
    refreshList();
  }

  function readMacrosFromNode(node) {
    let w = node.widgets?.find(w => w.name === "macros_json");
    if (!w) return [];
    try {
      return JSON.parse(w.value || "[]");
    } catch {
      return [];
    }
  }

  function writeMacrosToNode(node, macros) {
    let w = node.widgets?.find(w => w.name === "macros_json");
    if (w) {
      w.value = JSON.stringify(macros, null, 2);
      app.graph.setDirtyCanvas(true,true);
    }
  }

  let hotkeyMap = {};

  function registerAllHotkeys(macros) {
    hotkeyMap = {};
    macros.filter(m => m.hotkey && m.active !== false).forEach(m => {
      hotkeyMap[m.hotkey.toLowerCase()] = m;
    });
  }

  function parseHotkey(ev) {
    const parts = [];
    if (ev.altKey) parts.push("alt");
    if (ev.ctrlKey) parts.push("ctrl");
    if (ev.metaKey) parts.push("meta");
    if (ev.shiftKey) parts.push("shift");
    let k = ev.key.toLowerCase();
    // ignore pure modifiers
    if (["alt","control","shift","meta"].includes(k)) return "";
    parts.push(k);
    return parts.join("+");
  }

  window.addEventListener("keydown", (ev) => {
    const combo = parseHotkey(ev);
    if (!combo) return;
    if (hotkeyMap[combo]) {
      ev.preventDefault();
      executeMacro(hotkeyMap[combo]);
    }
  }, { capture: true });

  function executeMacro(macro) {
    const node = app.graph._nodes.find(n => n.id === macro.target_node_id);
    if (!node) return;
    const widget = node.widgets?.find(w => w.name === macro.target_param);
    if (!widget) return;

    switch(macro.mode) {
      case "jump":
        // Focus/scroll to node
        app.canvas.selectNode(node);
        app.canvas.centerOnNode(node);
        break;

      case "set_static":
        if (macro.raw_value) {
          trySetWidgetValue(widget, macro.raw_value);
        }
        break;

      case "toggle":
        if (typeof widget.value === "boolean") {
          widget.value = !widget.value;
        } else if (Array.isArray(widget.options?.values)) {
          // cycle enumerations
          const vals = widget.options.values;
          let idx = vals.indexOf(widget.value);
          widget.value = vals[(idx + 1) % vals.length];
        }
        break;

      case "preset_cycle":
        try {
          const arr = JSON.parse(macro.raw_value);
          if (Array.isArray(arr) && arr.length) {
            let currentIndex = arr.indexOf(widget.value);
            widget.value = arr[(currentIndex + 1) % arr.length];
          }
        } catch {}
        break;
    }

    app.graph.setDirtyCanvas(true, true);
  }

  function trySetWidgetValue(widget, raw) {
    // Basic heuristics
    if (widget.type === "number") {
      const num = Number(raw);
      if (!Number.isNaN(num)) widget.value = num;
    } else {
      // Attempt JSON parse for complex structures
      try {
        const parsed = JSON.parse(raw);
        widget.value = parsed;
      } catch {
        widget.value = raw;
      }
    }
  }

  app.registerExtension({
    name: EXT_NAME,
    nodeCreated(node) {
      if (node.comfyClass === "MacroHub") {
        // Register hotkeys (in case loaded workflow pre-filled)
        const macros = readMacrosFromNode(node);
        registerAllHotkeys(macros);
      }
    },
    async beforeRegisterNodeDef(nodeType, nodeData, appRef) {
      // Wrap the original onDrawForeground or onShowProperties to inject panel
      const origGetExtraMenuOptions = nodeType.prototype.getExtraMenuOptions;
      nodeType.prototype.getExtraMenuOptions = function(_, options) {
        if (this.comfyClass === "MacroHub") {
          options.push(
            {
              content: "Open Macro Panel",
              callback: () => {
                const inspector = document.querySelector(".comfy-modal-content") || document.body;
                // Or rely on existing inspector container
                if (this.__refreshMacroList) {
                  // Already built
                }
              }
            }
          );
        }
        if (origGetExtraMenuOptions) origGetExtraMenuOptions.apply(this, arguments);
      };

      const origOnSelected = nodeType.prototype.onSelected;
      nodeType.prototype.onSelected = function() {
        if (origOnSelected) origOnSelected.apply(this, arguments);
        if (this.comfyClass === "MacroHub") {
          // Find property panel container
          const sidePanel = document.querySelector("#comfy-right-panel") || document.body;
          ensureMacroPanel(this, sidePanel);
          if (this.__refreshMacroList) this.__refreshMacroList();
        }
      };
    }
  });
})();