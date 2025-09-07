# MacroHub for ComfyUI

A productivity extension that lets you define "macros" referencing any modifiable parameter (widget) in your ComfyUI workflow. Create hotkeys to jump to nodes, toggle values, cycle presets, or apply static overrides—without hunting across a sprawling canvas.

---

## Features

- Dedicated MacroHub node that stores macros in your workflow JSON (portable + shareable).
- Frontend panel (auto-injects when a MacroHub node is selected) to:
  - Add / edit / delete macros.
  - Assign hotkeys (e.g. `Alt+1`, `Ctrl+Shift+R`).
  - Define modes: `jump`, `set_static`, `toggle`, `preset_cycle`.
- Hotkey dispatcher (global listener) executes actions instantly.
- Parameter targeting: any widget with supported types (number sliders, text inputs, dropdowns, checkboxes, combos).
- Preset cycling (e.g. rotate through sampler names, style prompts, model aliases).
- Workflow persistence: macros are embedded in the `macros_json` STRING widget of the MacroHub node.
- (Optional) Execution-time overrides (enable in node settings) to enforce `set_static` macros before run.
- Graceful handling of missing nodes/parameters (fails silently; highlights future enhancement points).

---

## Roadmap (Planned Enhancements)

| Status | Item |
| ------ | ---- |
| 🚧 | Conflict detection on duplicate hotkeys (currently naive override) |
| ✅ | Persistent macros in workflow exports |
| 🔜 | Bulk capture: snapshot multiple parameters into a macro group |
| 🔜 | Global (no-node) panel mode |
| 🔜 | Export/import macro sets separately (`.macroset.json`) |
| 🔜 | Visual indicator for overridden parameters |
| 🔜 | Multi-value numeric ramp application |

---

## Installation

### Quick Drop-In (Recommended)

1. Navigate to your ComfyUI root directory.
2. Create directory: `custom_nodes/macro_hub/`
3. Copy the repository contents so paths look like:
   ```
   ComfyUI/
     custom_nodes/
       macro_hub/
         macro_hub.py
         __init__.py
         pyproject.toml (optional)
         LICENSE
         README.md
     web/
       extensions/
         macro_hub_extension.js
   ```
4. Restart ComfyUI.
5. Add the node "Macro Hub" from category `Utility/Macros`.

### Git Clone Pattern

```
cd ComfyUI/custom_nodes
git clone https://github.com/yourname/comfyui-macro-hub macro_hub
```

---

## Usage

1. Add a "Macro Hub" node.
2. Select it — a "Macros" panel appears in the right-side inspector.
3. Click "Add Macro":
   - Choose mode:
     - `jump`: centers view on the node + selects it.
     - `set_static`: sets a value once (on hotkey).
     - `toggle`: flips booleans or cycles enumerations.
     - `preset_cycle`: cycles through a provided JSON array of values.
   - Pick target parameter (node ID + widget).
   - Optional: enter value(s):
     - For `set_static`: a single literal (string/number) or JSON.
     - For `preset_cycle`: JSON array, e.g. `["euler","euler_ancestral","dpmpp_2m"]`
   - Assign a hotkey (e.g. `Alt+2`).
4. Press the hotkey while ComfyUI is active.
5. (Optional) Set node's `apply_overrides = on_execution` to enforce all active `set_static` values just before queuing.

---

## Macro Object Schema

Example entry stored inside `macros_json` widget:

```json
{
  "id": "8c2c8b8e-6b83-4cfc-a4d0-1d6ce6b62e90",
  "label": "CFG Quick",
  "mode": "set_static",
  "target_node_id": 47,
  "target_param": "cfg",
  "raw_value": "7.5",
  "hotkey": "Alt+1",
  "active": true
}
```

Field | Type | Description
----- | ---- | -----------
id | string (UUID) | Unique identifier
label | string | Friendly name
mode | enum | `jump | set_static | toggle | preset_cycle`
target_node_id | number | Node ID in current graph
target_param | string | Widget name
raw_value | string | Raw text (single value or JSON array)
hotkey | string | Canonical hotkey string (case-insensitive)
active | boolean | Enable/disable macro

---

## Hotkey Format

- Use combinations like: `Alt+1`, `Ctrl+Shift+M`, `Meta+R`
- Order of modifiers does not matter internally.
- If multiple macros share a hotkey, the last registered overwrites earlier (improved conflict UX planned).

---

## Supported Widget Types

Widget Type | Behaviors Supported
----------- | -------------------
number slider | set_static, preset_cycle, toggle (not recommended), jump
text | set_static, preset_cycle, jump
checkbox (boolean) | toggle, set_static
combo / dropdown | toggle (cycles), preset_cycle, set_static
Others | Attempted but may not always apply correctly

---

## Execution-Time Overrides

Set the MacroHub node's dropdown `apply_overrides` to `on_execution` to:
- Parse active macros.
- For each `set_static` macro, inject value into the target widget before graph evaluation.
- This is useful when you want guaranteed values for reproducibility without manually hitting hotkeys first.

Note: This mutates the widgets before run; it does not revert them.

---

## Limitations

- Does not persist macros outside the workflow unless you manually copy JSON.
- No built-in visual highlight of changed fields (yet).
- Deleting a referenced node leaves a dangling macro (safe but inert).

---

## Development

Recommend creating a lightweight virtual environment:

```
python -m venv venv
source venv/bin/activate
pip install -e .
```

Then restart ComfyUI with your extension in place.

---

## File Layout

```
macro_hub/
  macro_hub.py
  __init__.py
  pyproject.toml
  LICENSE
  README.md
web/
  extensions/
    macro_hub_extension.js
```

---

## Uninstall

Simply remove:
- `custom_nodes/macro_hub/`
- `web/extensions/macro_hub_extension.js`

Restart ComfyUI.

---

## Troubleshooting

Issue | Cause | Fix
----- | ----- | ---
Macros panel not showing | Node not selected / file mis-placed | Ensure `macro_hub.py` loads; check console
Hotkeys unresponsive | Browser focus lost | Click on canvas area
Preset cycle not cycling | JSON invalid | Validate array syntax
Execution override ignored | Mode not `set_static` | Use proper mode or enable apply_overrides

---

## Contributing

PRs welcome:
- Add conflict detection
- Improve parameter introspection
- Provide persistent macro library

---

## License

MIT – See [LICENSE](./LICENSE)

---

## Disclaimer

Tested against ComfyUI master as of 2025-09. Internal APIs can change; report breakages via issues.

---

Happy automating ✨
