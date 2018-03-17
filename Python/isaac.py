from switch_controller import *

def main():
    with Controller(default_wait=0.1, debug=True) as controller:
        try:
            # Reset Binding of Isaac and use D4 on Lost automatically

            while True:
                # Main menu
                controller.push_dpad(DPAD_UP)
                controller.push_button(BUTTON_A)

                # Character select
                controller.push_dpad(DPAD_LEFT)
                controller.push_dpad(DPAD_LEFT)
                controller.push_dpad(DPAD_LEFT)
                controller.push_dpad(DPAD_LEFT)
                controller.push_dpad(DPAD_LEFT)
                controller.push_button(BUTTON_A)

                # Wait for loading screen
                controller.wait(4.0)

                # Activate the D4
                controller.push_button(BUTTON_ZL)
                controller.wait(2.0)

                # Exit game
                controller.push_button(BUTTON_PLUS)
                controller.push_dpad(DPAD_DOWN)
                controller.push_button(BUTTON_A)
                controller.wait(1.5)

        except KeyboardInterrupt:
            pass

        # Reset the controller to neutral state before exiting.
        controller.reset().wait()

if __name__ == '__main__':
    main()
