#!/usr/bin/env python3
"""
Installation verification script for MacroHub ComfyUI Extension

Run this script from the ComfyUI root directory to verify MacroHub is properly installed.
"""

import os
import sys
import json

def check_installation():
    """Check if MacroHub is properly installed in ComfyUI"""
    print("MacroHub Installation Verification")
    print("=" * 40)
    
    # Check if we're in ComfyUI directory
    if not os.path.exists("main.py") or not os.path.exists("custom_nodes"):
        print("❌ Please run this script from the ComfyUI root directory")
        return False
    
    print("✓ Running from ComfyUI directory")
    
    # Check Python backend
    backend_path = "custom_nodes/macro_hub"
    if not os.path.exists(backend_path):
        print(f"❌ Backend directory not found: {backend_path}")
        print("   Please copy macro_hub/ to custom_nodes/")
        return False
    
    print("✓ Backend directory found")
    
    required_py_files = [
        "custom_nodes/macro_hub/__init__.py",
        "custom_nodes/macro_hub/macro_hub.py"
    ]
    
    for file_path in required_py_files:
        if not os.path.exists(file_path):
            print(f"❌ Required file missing: {file_path}")
            return False
    
    print("✓ All Python files present")
    
    # Check frontend extension
    js_path = "web/extensions/macro_hub_extension.js"
    if not os.path.exists(js_path):
        print(f"❌ Frontend extension missing: {js_path}")
        print("   Please copy web/extensions/macro_hub_extension.js to web/extensions/")
        return False
    
    print("✓ Frontend extension found")
    
    # Try to import the backend
    try:
        sys.path.insert(0, "custom_nodes")
        from macro_hub import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS
        
        if "MacroHub" not in NODE_CLASS_MAPPINGS:
            print("❌ MacroHub node not properly registered")
            return False
            
        print("✓ Backend module imports successfully")
        
        # Test basic functionality
        MacroHub = NODE_CLASS_MAPPINGS["MacroHub"]
        hub = MacroHub()
        result = hub.run("[]", "disabled")
        
        if result != ("[]",):
            print("❌ Backend functionality test failed")
            return False
            
        print("✓ Backend functionality test passed")
        
    except ImportError as e:
        print(f"❌ Failed to import backend: {e}")
        return False
    except Exception as e:
        print(f"❌ Backend test failed: {e}")
        return False
    
    print("\n🎉 MacroHub installation verified successfully!")
    print("\nNext steps:")
    print("1. Restart ComfyUI")
    print("2. Add a 'Macro Hub' node from the Utility/Macros category")
    print("3. Select the node to see the macro management panel")
    return True

if __name__ == "__main__":
    success = check_installation()
    sys.exit(0 if success else 1)