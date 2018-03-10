from switch_controller import *

def main():
    with Controller() as controller:
        try:
            # Testing operating Fire Emblem Warriors with controller

            # Move from endgame to story chapter 20 select
            controller.push_dpad(DPAD_LEFT, 0.3)

            # Confirm start and wait for scenario to load
            controller.push_button(BUTTON_A, 0.3)
            controller.push_button(BUTTON_A, 28)

            # Skip cutscene
            controller.push_button(BUTTON_PLUS, 2.0)

            # Start scenario
            controller.push_button(BUTTON_A, 1.0)
            controller.push_dpad(DPAD_UP, 0.3)
            controller.push_button(BUTTON_A, 0.3)
            controller.push_dpad(DPAD_LEFT, 0.3)
            controller.push_button(BUTTON_A, 0.3)

            # Here is where hypothetical OpenCV code + game logic would run.

            # Exit scenario
            """
            controller.push_button(BUTTON_PLUS, 0.3)
            controller.push_button(BUTTON_B, 0.3)
            controller.hold_dpad(DPAD_DOWN, 1.0)
            controller.push_button(BUTTON_A, 0.3)
            controller.hold_dpad(DPAD_LEFT, 0.3)
            controller.push_button(BUTTON_A, 0.3)
            """

        except KeyboardInterrupt:
            pass

        # Reset the controller to neutral state before exiting.
        controller.reset().wait()

if __name__ == '__main__':
    main()
