/*
Nintendo Switch Fightstick - Proof-of-Concept

Based on the LUFA library's Low-Level Joystick Demo
    (C) Dean Camera
Based on the HORI's Pokken Tournament Pro Pad design
    (C) HORI

This project implements a modified version of HORI's Pokken Tournament Pro Pad
USB descriptors to allow for the creation of custom controllers for the
Nintendo Switch. This also works to a limited degree on the PS3.

Since System Update v3.0.0, the Nintendo Switch recognizes the Pokken
Tournament Pro Pad as a Pro Controller. Physical design limitations prevent
the Pokken Controller from functioning at the same level as the Pro
Controller. However, by default most of the descriptors are there, with the
exception of Home and Capture. Descriptor modification allows us to unlock
these buttons for our use.
*/

#include "Joystick.h"

typedef enum {
    SYNCED,
    SYNC_START,
    SYNC_1,
    OUT_OF_SYNC
} State_t;

typedef struct {
    uint8_t input[8];
    uint8_t crc8_ccitt;
    uint8_t received_bytes;
} USB_Input_Packet_t;

USB_Input_Packet_t usbInput;
USB_JoystickReport_Input_t buffer;
USB_JoystickReport_Input_t defaultBuf;
State_t state = OUT_OF_SYNC;

ISR(USART1_RX_vect) {
    uint8_t b = recv_byte();
    if (state == SYNC_START) {
        if (b == COMMAND_SYNC_1) {
            state = SYNC_1;
            send_byte(RESP_SYNC_1);
        }
        else state = OUT_OF_SYNC;
    } else if (state == SYNC_1) {
        if (b == COMMAND_SYNC_2) {
            state = SYNCED;
            send_byte(RESP_SYNC_OK);
        }
        else state = OUT_OF_SYNC;
    } else if (state == SYNCED) {

        if (usbInput.received_bytes < 8) {
            // Still filling up the buffer
            usbInput.input[usbInput.received_bytes++] = b;
            usbInput.crc8_ccitt = _crc8_ccitt_update(usbInput.crc8_ccitt, b);

        } else {
            if (usbInput.crc8_ccitt != b) {
                if (b == COMMAND_SYNC_START) {
                    // Start sync
                    state = SYNC_START;
                    send_byte(RESP_SYNC_START);
                } else {
                    // Mismatched CRC
                    send_byte(RESP_UPDATE_NACK);
                }
                
            } else {
                // Everything is ok
                buffer.Button = (usbInput.input[0] << 8) | usbInput.input[1];
                buffer.HAT = usbInput.input[2];
                buffer.LX = usbInput.input[3];
                buffer.LY = usbInput.input[4];
                buffer.RX = usbInput.input[5];
                buffer.RY = usbInput.input[6];
                buffer.VendorSpec = usbInput.input[7];
                // send_byte(RESP_UPDATE_ACK);
            }
            usbInput.received_bytes = 0;
            usbInput.crc8_ccitt = 0;
        }
    }
    if (state == OUT_OF_SYNC) {
        if (b == COMMAND_SYNC_START) {
            state = SYNC_START;
            send_byte(RESP_SYNC_START);
        }
    }
}

// Main entry point.
int main(void) {
    // We also need to initialize the initial input reports.
    memset(&defaultBuf, 0, sizeof(USB_JoystickReport_Input_t));
    defaultBuf.LX = STICK_CENTER;
    defaultBuf.LY = STICK_CENTER;
    defaultBuf.RX = STICK_CENTER;
    defaultBuf.RY = STICK_CENTER;
    defaultBuf.HAT = HAT_CENTER;
    memcpy(&buffer, &defaultBuf, sizeof(USB_JoystickReport_Input_t));

    memset(&usbInput, 0, sizeof(USB_Input_Packet_t));

    // We'll start by performing hardware and peripheral setup.
    SetupHardware();
    // We'll then enable global interrupts for our use.
    GlobalInterruptEnable();
    // Once that's done, we'll enter an infinite loop.
    for (;;)
    {
        // We need to run our task to process and deliver data for our IN and OUT endpoints.
        HID_Task();
        // We also need to run the main USB management task.
        USB_USBTask();
    }
}

// Configures hardware and peripherals, such as the USB peripherals.
void SetupHardware(void) {
    // We need to disable watchdog if enabled by bootloader/fuses.
    disable_watchdog();

    // We need to disable clock division before initializing the USB hardware.
    clock_prescale_set(clock_div_1);
    // We can then initialize our hardware and peripherals, including the USB stack.
    USART_Init(19200);

    // The USB stack should be initialized last.
    USB_Init();
}

// Fired to indicate that the device is enumerating.
void EVENT_USB_Device_Connect(void) {
    // We can indicate that we're enumerating here (via status LEDs, sound, etc.).
}

// Fired to indicate that the device is no longer connected to a host.
void EVENT_USB_Device_Disconnect(void) {
    // We can indicate that our device is not ready (via status LEDs, sound, etc.).
}

// Fired when the host set the current configuration of the USB device after enumeration.
void EVENT_USB_Device_ConfigurationChanged(void) {
    bool ConfigSuccess = true;

    // We setup the HID report endpoints.
    ConfigSuccess &= Endpoint_ConfigureEndpoint(JOYSTICK_OUT_EPADDR, EP_TYPE_INTERRUPT, JOYSTICK_EPSIZE, 1);
    ConfigSuccess &= Endpoint_ConfigureEndpoint(JOYSTICK_IN_EPADDR, EP_TYPE_INTERRUPT, JOYSTICK_EPSIZE, 1);

    // We can read ConfigSuccess to indicate a success or failure at this point.
}

// Process control requests sent to the device from the USB host.
void EVENT_USB_Device_ControlRequest(void) {
    // We can handle two control requests: a GetReport and a SetReport.

    // Not used here, it looks like we don't receive control request from the Switch.
}

// Process and deliver data from IN and OUT endpoints.
void HID_Task(void) {
    // If the device isn't connected and properly configured, we can't do anything here.
    if (USB_DeviceState != DEVICE_STATE_Configured)
        return;

    // We'll start with the OUT endpoint.
    Endpoint_SelectEndpoint(JOYSTICK_OUT_EPADDR);
    // We'll check to see if we received something on the OUT endpoint.
    if (Endpoint_IsOUTReceived())
    {
        // If we did, and the packet has data, we'll react to it.
        if (Endpoint_IsReadWriteAllowed())
        {
            // We'll create a place to store our data received from the host.
            USB_JoystickReport_Output_t JoystickOutputData;

            // We'll then take in that data, setting it up in our storage.
            while(Endpoint_Read_Stream_LE(&JoystickOutputData, sizeof(JoystickOutputData), NULL) != ENDPOINT_RWSTREAM_NoError);

            // At this point, we can react to this data.

            // However, since we're not doing anything with this data, we abandon it.
        }
        // Regardless of whether we reacted to the data, we acknowledge an OUT packet on this endpoint.
        Endpoint_ClearOUT();
    }

    // We'll then move on to the IN endpoint.
    Endpoint_SelectEndpoint(JOYSTICK_IN_EPADDR);
    // We first check to see if the host is ready to accept data.
    if (Endpoint_IsINReady())
    {
        // We'll create an empty report.
        USB_JoystickReport_Input_t JoystickInputData;

        // We'll then populate this report with what we want to send to the host.
        disable_rx_isr();
        if (state == SYNCED) {                
            memcpy(&JoystickInputData, &buffer, sizeof(USB_JoystickReport_Input_t));
            send_byte(RESP_USB_ACK);
        } else {
            memcpy(&JoystickInputData, &defaultBuf, sizeof(USB_JoystickReport_Input_t));
        }
        enable_rx_isr();

        // Once populated, we can output this data to the host. We do this by first writing the data to the control stream.
        while(Endpoint_Write_Stream_LE(&JoystickInputData, sizeof(JoystickInputData), NULL) != ENDPOINT_RWSTREAM_NoError);
        
        // We then send an IN packet on this endpoint.
        Endpoint_ClearIN();
    }
}
