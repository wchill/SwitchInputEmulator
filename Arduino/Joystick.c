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
#define SERIAL_UBBRVAL(Baud)    ((((F_CPU / 16) + (Baud / 2)) / (Baud)) - 1)

RingBuffer_t USART_Buffer;
uint8_t buf[128];

typedef enum {
    NEW_PACKET,
    REPLAY_PACKET,
    SYNC_START,
    SYNC_1,
    OUT_OF_SYNC
} State_t;

USB_JoystickReport_Input_t buffer;
USB_JoystickReport_Input_t defaultBuf;
State_t state = OUT_OF_SYNC;
uint8_t syncBuf[4];
int syncIndex = 0;

// Initializes the USART, note that the RX/TX interrupts need to be enabled manually.
void USART_Init(void) {
    UCSR1A = 0;                         // disable double speed mode
    UCSR1C = _BV(UCSZ11) | _BV(UCSZ10); // no parity, 8 data bits, 1 stop bit
    UCSR1D = 0;                         // no cts, no rts
    UBRR1  = SERIAL_UBBRVAL(19200);     // 19200 baud
    UCSR1B = _BV(RXEN1) | _BV(TXEN1);   // enable RX and TX
    DDRD  |= _BV(3);                    // set TX pin as output
    PORTD |= _BV(2);                    // set RX pin as input
}

inline void disable_rx_isr(void) {
    UCSR1B &= ~_BV(RXCIE1);
}

inline void enable_rx_isr(void) {
    UCSR1B |= _BV(RXCIE1);
}

inline void send_byte(uint8_t c) {
    while (!(UCSR1A & _BV(UDRE1)));
    UDR1 = c;
}

inline void send_string(const char *str) {
    while (*str) {
        send_byte(*str++);
    }
}

inline uint8_t recv_byte(void) {
    while (!(UCSR1A & _BV(RXC1)));
    return UDR1;
}

ISR(USART1_RX_vect) {
    if (state == SYNC_START) {
        if (recv_byte() == 0x33) {
            state = SYNC_1;
            send_byte(0xCC);
        }
        else state = OUT_OF_SYNC;
    } else if (state == SYNC_1) {
        if (recv_byte() == 0xCC) {
            state = NEW_PACKET;
            send_byte(0x33);
        }
        else state = OUT_OF_SYNC;
    } else if (state == NEW_PACKET || state == REPLAY_PACKET) {
        RingBuffer_Insert(&USART_Buffer, recv_byte());
        if (RingBuffer_GetCount(&USART_Buffer) >= sizeof(USB_JoystickReport_Input_t)) {
            // Pop 8 bytes off the buffer and create a new USB input report
            // We do it in the ISR to prevent data corruption
            buffer.Button     = (RingBuffer_Remove(&USART_Buffer) << 8) | RingBuffer_Remove(&USART_Buffer);
            buffer.HAT        = RingBuffer_Remove(&USART_Buffer);
            buffer.LX         = RingBuffer_Remove(&USART_Buffer);
            buffer.LY         = RingBuffer_Remove(&USART_Buffer);
            buffer.RX         = RingBuffer_Remove(&USART_Buffer);
            buffer.RY         = RingBuffer_Remove(&USART_Buffer);
            buffer.VendorSpec = RingBuffer_Remove(&USART_Buffer);
            if (buffer.VendorSpec == COMMAND_SYNC) {
                state = SYNC_START;
                RingBuffer_InitBuffer(&USART_Buffer, buf, sizeof(buf));
                send_byte(COMMAND_SYNC);
            } else {
                state = NEW_PACKET;
            }
        }
    } else if (state == OUT_OF_SYNC) {
        if (recv_byte() == COMMAND_SYNC) {
            state = SYNC_START;
            send_byte(COMMAND_SYNC);
        }
    }
}

// Main entry point.
int main(void) {
    // Initialize the ring buffer for input packets.
    RingBuffer_InitBuffer(&USART_Buffer, buf, sizeof(buf));

    // We also need to initialize the initial input reports.
    memset(&defaultBuf, 0, sizeof(USB_JoystickReport_Input_t));
    defaultBuf.LX = STICK_CENTER;
    defaultBuf.LY = STICK_CENTER;
    defaultBuf.RX = STICK_CENTER;
    defaultBuf.RY = STICK_CENTER;
    defaultBuf.HAT = HAT_CENTER;
    memcpy(&buffer, &defaultBuf, sizeof(USB_JoystickReport_Input_t));

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
    MCUSR &= ~(1 << WDRF);
    wdt_disable();

    // We need to disable clock division before initializing the USB hardware.
    clock_prescale_set(clock_div_1);
    // We can then initialize our hardware and peripherals, including the USB stack.
    USART_Init();

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
        if (state == NEW_PACKET || state == REPLAY_PACKET) {                
            memcpy(&JoystickInputData, &buffer, sizeof(USB_JoystickReport_Input_t));
        } else {
            memcpy(&JoystickInputData, &defaultBuf, sizeof(USB_JoystickReport_Input_t));
        }
        enable_rx_isr();

        // Once populated, we can output this data to the host. We do this by first writing the data to the control stream.
        while(Endpoint_Write_Stream_LE(&JoystickInputData, sizeof(JoystickInputData), NULL) != ENDPOINT_RWSTREAM_NoError);
        
        // We then send an IN packet on this endpoint.
        Endpoint_ClearIN();

        if (state == NEW_PACKET) {
            send_byte(0x90);
            state = REPLAY_PACKET;
        }
    }
}
