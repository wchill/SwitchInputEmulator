from switch_controller import *

def main():
    with Controller() as controller:
        # Presses L and R to activate controller in controller order change menu.

        """
        controller.push_buttons(BUTTON_L, BUTTON_R, wait=2.0)
        controller.push_buttons(BUTTON_A, wait=2.0)
        controller.reset().wait()
        """
        controller.hold_dpad(DPAD_RIGHT, wait=2.0)
        controller.hold_dpad(DPAD_LEFT, wait=2.0)
        controller.reset().wait()

if __name__ == '__main__':
    main()
