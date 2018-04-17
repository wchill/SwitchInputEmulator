#ifndef _JOYSTICK_AVR_H
#define _JOYSTICK_AVR_H

#include <unistd.h>
#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>
#include <string.h>
#include <sys/select.h>

#define USART1_RX_vect USART1_RX_vect
#define clock_div_1 0
#define JOYSTICK_OUT_EPADDR 0
#define JOYSTICK_IN_EPADDR 0
#define EP_TYPE_INTERRUPT 0
#define JOYSTICK_EPSIZE 0
#define USB_DeviceState 0
#define DEVICE_STATE_Configured 0
#define ENDPOINT_RWSTREAM_NoError 0

#define MAKE_FN_NAME(x) void  _ISR_ ## x (void)
#define ISR(vector_num) MAKE_FN_NAME(vector_num)

// https://stackoverflow.com/a/1594514
int is_ready(int fd) {
    fd_set fdset;
    struct timeval timeout;
    int ret;
    FD_ZERO(&fdset);
    FD_SET(fd, &fdset);
    timeout.tv_sec = 0;
    timeout.tv_usec = 1;
    //int select(int nfds, fd_set *readfds, fd_set *writefds, fd_set *exceptfds, struct timeval *timeout);
    return select(fd+1, &fdset, NULL, NULL, &timeout) == 1 ? 1 : 0;
}

void USART_Init(int baud) {}

void disable_watchdog(void) {}

void disable_rx_isr(void) {}

void enable_rx_isr(void) {}

void send_byte(uint8_t c) {
    write(fileno(stdout), &c, sizeof(c));
}

void send_string(const char *str) {
    write(fileno(stdout), str, strlen(str));
    fsync(fileno(stdout));
}

uint8_t recv_byte(void) {
    uint8_t val;
    read(fileno(stdin), &val, sizeof(val));
    return val;
}

// https://www.microchip.com/webdoc/AVRLibcReferenceManual/group__util__crc_1gab27eaaef6d7fd096bd7d57bf3f9ba083.html
uint8_t _crc8_ccitt_update (uint8_t inCrc, uint8_t inData)
{
    uint8_t   i;
    uint8_t   data;

    data = inCrc ^ inData;

    for ( i = 0; i < 8; i++ )
    {
        if (( data & 0x80 ) != 0 )
        {
            data <<= 1;
            data ^= 0x07;
        }
        else
        {
            data <<= 1;
        }
    }
    return data;
}

void GlobalInterruptEnable(void) {}
void clock_prescale_set(int val) {}

void USB_Init(void) {}

extern void _ISR_USART1_RX_vect(void);
void USB_USBTask(void) {
    while (is_ready(0)) _ISR_USART1_RX_vect();
}
bool Endpoint_ConfigureEndpoint(int val1, int val2, int val3, int val4) {return true;}

void Endpoint_SelectEndpoint(int val) {}
bool Endpoint_IsOUTReceived(void) {return false;}
bool Endpoint_IsReadWriteAllowed(void) {return false;}
int Endpoint_Read_Stream_LE(void *const buf, size_t len, uint16_t *const bytesProcessed) {return ENDPOINT_RWSTREAM_NoError;}
void Endpoint_ClearOUT(void) {}

bool Endpoint_IsINReady(void) {return true;}
int Endpoint_Write_Stream_LE(void *const buf, size_t len, uint16_t *const bytesProcessed) {return ENDPOINT_RWSTREAM_NoError;}
void Endpoint_ClearIN(void) {}

#endif
