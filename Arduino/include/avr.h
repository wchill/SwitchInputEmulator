#ifndef _JOYSTICK_AVR_H
#define _JOYSTICK_AVR_H

/* Includes: */
#include <avr/io.h>
#include <avr/wdt.h>
#include <avr/power.h>
#include <avr/interrupt.h>
#include <avr/pgmspace.h>
#include <string.h>
#include <util/crc16.h>

#include <LUFA/Drivers/USB/USB.h>
#include <LUFA/Drivers/Board/Joystick.h>
#include <LUFA/Drivers/Board/LEDs.h>
#include <LUFA/Drivers/Board/Buttons.h>
#include <LUFA/Drivers/Misc/RingBuffer.h>
#include <LUFA/Platform/Platform.h>

#define SERIAL_UBBRVAL(Baud)    ((((F_CPU / 16) + (Baud / 2)) / (Baud)) - 1)
#define PRINT_DEBUG(...)

// Initializes the USART, note that the RX/TX interrupts need to be enabled manually.
void USART_Init(int baud) {
    UCSR1A = 0;                         // disable double speed mode
    UCSR1C = _BV(UCSZ11) | _BV(UCSZ10); // no parity, 8 data bits, 1 stop bit
    UCSR1D = 0;                         // no cts, no rts
    UBRR1  = SERIAL_UBBRVAL(baud);      // set baud rate
    UCSR1B = _BV(RXEN1) | _BV(TXEN1);   // enable RX and TX
    DDRD  |= _BV(3);                    // set TX pin as output
    PORTD |= _BV(2);                    // set RX pin as input
}

void disable_watchdog(void) {
    MCUSR &= ~(1 << WDRF);
    wdt_disable();
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

#endif
