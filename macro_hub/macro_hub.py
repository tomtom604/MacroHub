"""
MacroHub ComfyUI Custom Node

A hub node to store macro definitions and optionally apply parameter overrides.
Macros are stored as a JSON string in the 'macros_json' input and can be 
used to create hotkeys for workflow automation.
"""

import json


class MacroHub:
    """
    A hub node to store macro definitions and (optionally) apply parameter overrides.
    Macros are stored as a JSON string in the 'macros' input (or internal state if desired).
    """

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "macros_json": ("STRING", {
                    "default": "[]",
                    "multiline": True,
                    "placeholder": "[]  (Array of macro objects)"
                }),
                "apply_overrides": (["disabled", "on_execution"], {"default": "disabled"}),
            }
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("macros_json_out",)
    FUNCTION = "run"
    CATEGORY = "Utility/Macros"

    def run(self, macros_json: str, apply_overrides: str):
        """
        Optionally parse macros and apply overrides before downstream nodes execute.
        For now this just echoes the JSON. To implement overrides, you'd hook into
        the graph or patch node params here (requires internal ComfyUI references).
        """
        try:
            macros = json.loads(macros_json)
        except json.JSONDecodeError:
            macros = []
        
        # Placeholder: override logic would go here
        # Example pseudo:
        # if apply_overrides == "on_execution":
        #     for macro in macros:
        #         if macro.get("active") and macro.get("mode") == "set_static":
        #             target_id = macro["target_node_id"]
        #             param = macro["target_param"]
        #             value = macro.get("value")
        #             self._apply_value_to_node(target_id, param, value)
        
        return (json.dumps(macros),)


NODE_CLASS_MAPPINGS = {
    "MacroHub": MacroHub
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "MacroHub": "Macro Hub"
}