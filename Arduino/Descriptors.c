#include "Descriptors.h"

// HID Descriptors.

const USB_Descriptor_HIDReport_Datatype_t PROGMEM JoystickReport[] = {
    HID_RI_USAGE_PAGE(8,1),                         // Generic desktop controls
    HID_RI_USAGE(8,5),                              // Joystick
    HID_RI_COLLECTION(8,1),                         // Application

    // Buttons (2 bytes)
    HID_RI_LOGICAL_MINIMUM(8,0),                    // button off state
    HID_RI_LOGICAL_MAXIMUM(8,1),                    // button on state
    HID_RI_PHYSICAL_MINIMUM(8,0),                   // button off state
    HID_RI_PHYSICAL_MAXIMUM(8,1),                   // button on state
    HID_RI_REPORT_SIZE(8,1),                        // 1 bit per report field
    HID_RI_REPORT_COUNT(8,14),                      // 14 report fields (14 buttons)
    HID_RI_USAGE_PAGE(8,9),                         // Buttons (section 12)
    HID_RI_USAGE_MINIMUM(8,1),
    HID_RI_USAGE_MAXIMUM(8,14),
    HID_RI_INPUT(8,2),                              // Variable input
    HID_RI_REPORT_COUNT(8,2),                       // 2 report fields (empty 2 bits)
    HID_RI_INPUT(8,1),                              // Array input

    // HAT switch
    HID_RI_USAGE_PAGE(8,1),                         // Generic desktop controls
    HID_RI_LOGICAL_MAXIMUM(8,7),                    // 8 valid HAT states, sending 0x08 = nothing pressed
    HID_RI_PHYSICAL_MAXIMUM(16,315),                // HAT "rotation"
    HID_RI_REPORT_SIZE(8,4),                        // 4 bits per report field
    HID_RI_REPORT_COUNT(8,1),                       // 1 report field (a nibble containing entire HAT state)
    HID_RI_UNIT(8,20),                              // unit degrees
    HID_RI_USAGE(8,57),                             // Hat switch (section 4.3)
    HID_RI_INPUT(8,66),                             // Variable input, null state
    HID_RI_UNIT(8,0),                               // No units
    HID_RI_REPORT_COUNT(8,1),                       // 1 report field (empty upper nibble)
    HID_RI_INPUT(8,1),                              // Array input

    // Joystick (4 bytes)
    HID_RI_LOGICAL_MAXIMUM(16,255),                 // 0-255 for analog sticks
    HID_RI_PHYSICAL_MAXIMUM(16,255),
    HID_RI_USAGE(8,48),                             // X (left X)
    HID_RI_USAGE(8,49),                             // Y (left Y)
    HID_RI_USAGE(8,50),                             // Z (right X)
    HID_RI_USAGE(8,53),                             // Rz (right Y)
    HID_RI_REPORT_SIZE(8,8),                        // 1 byte per report field
    HID_RI_REPORT_COUNT(8,4),                       // 4 report fields (left X, left Y, right X, right Y)
    HID_RI_INPUT(8,2),                              // Variable input

    // I think this is the vendor spec byte.
    // On the Pokken pad this is usage page 0xFF00 which is vendor defined.
    // Usage is 0x20 on the Pokken pad, but since the usage page is vendor defined this is kind of meaningless.
    // Seems fine to just leave this byte set to 0.
    HID_RI_REPORT_SIZE(8,8),                        // 1 byte per report field
    HID_RI_REPORT_COUNT(8,1),                       // 1 report field
    HID_RI_INPUT(8,1),                              // Array input

    // On the Pokken pad apparently we also receive a mirror image of the sent inputs,
    // but according to the Hori pad USB descriptors this isn't necessary.
    // The usage page is still vendor defined, so the usage 0x2621 is meaningless to us.
    // On the Pokken pad this is an 8 byte report of dynamic output.

    /* This is where the Hori pad and modified Pokken pad diverge. Commenting out for future reference.
    // HAT Switch (1 nibble)
    HID_RI_USAGE_PAGE(8,1),
    HID_RI_LOGICAL_MAXIMUM(8,7),
    HID_RI_PHYSICAL_MAXIMUM(16,315),
    HID_RI_REPORT_SIZE(8,4),
    HID_RI_REPORT_COUNT(8,1),
    HID_RI_UNIT(8,20),
    HID_RI_USAGE(8,57),
    HID_RI_INPUT(8,66),
    // There's an additional nibble here that's utilized as part of the Switch Pro Controller.
    // I believe this -might- be separate U/D/L/R bits on the Switch Pro Controller, as they're utilized as four button descriptors on the Switch Pro Controller.
    HID_RI_UNIT(8,0),
    HID_RI_REPORT_COUNT(8,1),
    HID_RI_INPUT(8,1),
    // Joystick (4 bytes)
    HID_RI_LOGICAL_MAXIMUM(16,255),
    HID_RI_PHYSICAL_MAXIMUM(16,255),
    HID_RI_USAGE(8,48),
    HID_RI_USAGE(8,49),
    HID_RI_USAGE(8,50),
    HID_RI_USAGE(8,53),
    HID_RI_REPORT_SIZE(8,8),
    HID_RI_REPORT_COUNT(8,4),
    HID_RI_INPUT(8,2),
    // ??? Vendor Specific (1 byte)
    // This byte requires additional investigation.
    HID_RI_USAGE_PAGE(16,65280),
    HID_RI_USAGE(8,32),
    HID_RI_REPORT_COUNT(8,1),
    HID_RI_INPUT(8,2),
    // Output (8 bytes)
    // Original observation of this suggests it to be a mirror of the inputs that we sent.
    // The Switch requires us to have these descriptors available.
    HID_RI_USAGE(16,9761),
    HID_RI_REPORT_COUNT(8,8),
    HID_RI_OUTPUT(8,2),
    */

    HID_RI_END_COLLECTION(0),
};

// Device Descriptor Structure
const USB_Descriptor_Device_t PROGMEM DeviceDescriptor = {
    .Header                 = {.Size = sizeof(USB_Descriptor_Device_t), .Type = DTYPE_Device},

    .USBSpecification       = VERSION_BCD(2,0,0),
    .Class                  = USB_CSCP_NoDeviceClass,
    .SubClass               = USB_CSCP_NoDeviceSubclass,
    .Protocol               = USB_CSCP_NoDeviceProtocol,

    .Endpoint0Size          = FIXED_CONTROL_ENDPOINT_SIZE,

    .VendorID               = 0x0F0D,
    .ProductID              = 0x00C1,
    .ReleaseNumber          = VERSION_BCD(5,7,2),

    .ManufacturerStrIndex   = STRING_ID_Manufacturer,
    .ProductStrIndex        = STRING_ID_Product,
    .SerialNumStrIndex      = NO_DESCRIPTOR,

    .NumberOfConfigurations = FIXED_NUM_CONFIGURATIONS
};

// Configuration Descriptor Structure
const USB_Descriptor_Configuration_t PROGMEM ConfigurationDescriptor = {
    .Config =
        {
            .Header                 = {.Size = sizeof(USB_Descriptor_Configuration_Header_t), .Type = DTYPE_Configuration},

            .TotalConfigurationSize = sizeof(USB_Descriptor_Configuration_t),
            .TotalInterfaces        = 1,

            .ConfigurationNumber    = 1,
            .ConfigurationStrIndex  = NO_DESCRIPTOR,

            .ConfigAttributes       = 0x80,

            .MaxPowerConsumption    = USB_CONFIG_POWER_MA(250)
        },

    .HID_Interface =
        {
            .Header                 = {.Size = sizeof(USB_Descriptor_Interface_t), .Type = DTYPE_Interface},

            .InterfaceNumber        = INTERFACE_ID_Joystick,
            .AlternateSetting       = 0x00,

            .TotalEndpoints         = 2,

            .Class                  = HID_CSCP_HIDClass,
            .SubClass               = HID_CSCP_NonBootSubclass,
            .Protocol               = HID_CSCP_NonBootProtocol,

            .InterfaceStrIndex      = NO_DESCRIPTOR
        },

    /*
        Reference:
        hid_descriptor = b'\x09\x21\x11\x01\x00\x01\x22\x50\x00'
    */
    .HID_JoystickHID =
        {
            .Header                 = {.Size = sizeof(USB_HID_Descriptor_HID_t), .Type = HID_DTYPE_HID},

            .HIDSpec                = VERSION_BCD(1,1,1),
            .CountryCode            = 0x00,
            .TotalReportDescriptors = 1,
            .HIDReportType          = HID_DTYPE_Report,
            .HIDReportLength        = sizeof(JoystickReport)
        },

    .HID_ReportINEndpoint =
        {
            .Header                 = {.Size = sizeof(USB_Descriptor_Endpoint_t), .Type = DTYPE_Endpoint},

            .EndpointAddress        = JOYSTICK_IN_EPADDR,
            .Attributes             = (EP_TYPE_INTERRUPT | ENDPOINT_ATTR_NO_SYNC | ENDPOINT_USAGE_DATA),
            .EndpointSize           = JOYSTICK_EPSIZE,
            .PollingIntervalMS      = 0x05
        },

    .HID_ReportOUTEndpoint =
        {
            .Header                 = {.Size = sizeof(USB_Descriptor_Endpoint_t), .Type = DTYPE_Endpoint},

            .EndpointAddress        = JOYSTICK_OUT_EPADDR,
            .Attributes             = (EP_TYPE_INTERRUPT | ENDPOINT_ATTR_NO_SYNC | ENDPOINT_USAGE_DATA),
            .EndpointSize           = JOYSTICK_EPSIZE,
            .PollingIntervalMS      = 0x05
        },
};

// Language Descriptor Structure
const USB_Descriptor_String_t PROGMEM LanguageString = USB_STRING_DESCRIPTOR_ARRAY(LANGUAGE_ID_ENG);

// Manufacturer and Product Descriptor Strings
const USB_Descriptor_String_t PROGMEM ManufacturerString = USB_STRING_DESCRIPTOR(L"HORI CO.,LTD.");
const USB_Descriptor_String_t PROGMEM ProductString      = USB_STRING_DESCRIPTOR(L"HORIPAD S");

// USB Device Callback - Get Descriptor
uint16_t CALLBACK_USB_GetDescriptor(
    const uint16_t wValue,
    const uint16_t wIndex,
    const void** const DescriptorAddress
) {
    const uint8_t  DescriptorType   = (wValue >> 8);
    const uint8_t  DescriptorNumber = (wValue & 0xFF);

    const void* Address = NULL;
    uint16_t    Size    = NO_DESCRIPTOR;

    switch (DescriptorType)
    {
        case DTYPE_Device:
            Address = &DeviceDescriptor;
            Size    = sizeof(USB_Descriptor_Device_t);
            break;
        case DTYPE_Configuration:
            Address = &ConfigurationDescriptor;
            Size    = sizeof(USB_Descriptor_Configuration_t);
            break;
        case DTYPE_String:
            switch (DescriptorNumber)
            {
                case STRING_ID_Language:
                    Address = &LanguageString;
                    Size    = pgm_read_byte(&LanguageString.Header.Size);
                    break;
                case STRING_ID_Manufacturer:
                    Address = &ManufacturerString;
                    Size    = pgm_read_byte(&ManufacturerString.Header.Size);
                    break;
                case STRING_ID_Product:
                    Address = &ProductString;
                    Size    = pgm_read_byte(&ProductString.Header.Size);
                    break;
            }

            break;
        case DTYPE_HID:
            Address = &ConfigurationDescriptor.HID_JoystickHID;
            Size    = sizeof(USB_HID_Descriptor_HID_t);
            break;
        case DTYPE_Report:
            Address = &JoystickReport;
            Size    = sizeof(JoystickReport);
            break;
    }

    *DescriptorAddress = Address;
    return Size;
}
