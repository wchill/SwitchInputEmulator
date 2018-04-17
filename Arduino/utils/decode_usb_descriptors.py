import io
import struct
import binascii

global_items = {
    0x00: 'HID_RI_USAGE_PAGE',
    0x10: 'HID_RI_LOGICAL_MINIMUM',
    0x20: 'HID_RI_LOGICAL_MAXIMUM',
    0x30: 'HID_RI_PHYSICAL_MINIMUM',
    0x40: 'HID_RI_PHYSICAL_MAXIMUM',
    0x50: 'HID_RI_UNIT_EXPONENT',
    0x60: 'HID_RI_UNIT',
    0x70: 'HID_RI_REPORT_SIZE',
    0x80: 'HID_RI_REPORT_ID',
    0x90: 'HID_RI_REPORT_COUNT',
    0xA0: 'HID_RI_PUSH',
    0xB0: 'HID_RI_POP'
}

local_items = {
    0x00: 'HID_RI_USAGE',
    0x10: 'HID_RI_USAGE_MINIMUM',
    0x20: 'HID_RI_USAGE_MAXIMUM'
}

main_items = {
    0x80: 'HID_RI_INPUT',
    0x90: 'HID_RI_OUTPUT',
    0xA0: 'HID_RI_COLLECTION',
    0xB0: 'HID_RI FEATURE',
    0xC0: 'HID_RI_END_COLLECTION'
}

pokken_pad_modified = b'\x05\x01\t\x05\xa1\x01\x15\x00%\x015\x00E\x01u\x01\x95\x10\x05\t\x19\x01)\x10\x81\x02\x05\x01%\x07F;\x01u\x04\x95\x01e\x14\t9\x81Be\x00\x95\x01\x81\x01&\xff\x00F\xff\x00\t0\t1\t2\t5u\x08\x95\x04\x81\x02\x06\x00\xff\t \x95\x01\x81\x02\n!&\x95\x08\x91\x02\xc0'
hori_pad = b'\x05\x01\t\x05\xa1\x01\x15\x00%\x015\x00E\x01u\x01\x95\x0e\x05\t\x19\x01)\x0e\x81\x02\x95\x02\x81\x01\x05\x01%\x07F;\x01u\x04\x95\x01e\x14\t9\x81Be\x00\x95\x01\x81\x01&\xff\x00F\xff\x00\t0\t1\t2\t5u\x08\x95\x04\x81\x02u\x08\x95\x01\x81\x01\xc0'

def decode_hid_descriptor(descriptor): 
    res = []
    buf = io.BytesIO(descriptor)
    r = buf.read(1)
    while len(r) > 0:
        res_line = ''

        num = struct.unpack('B', r)[0]
        hid_item = num & 0xF0
        is_global = bool(num & 0x04)
        is_local = bool(num & 0x08)
        size_type = num & 0x03
        num_bits = 0
        if size_type == 0x01:
            num_bits = 8
        elif size_type == 0x02:
            num_bits = 16
        elif size_type == 0x03:
            num_bits = 32

        if is_global:
            res_line += global_items[hid_item]
        elif is_local:
            res_line += local_items[hid_item]
        else:
            res_line += main_items[hid_item]

        res_line += '(%d' % num_bits
        if num_bits > 0:
            data = buf.read(num_bits // 8)
            if num_bits == 8:
                res_line += ', 0x%.2X' % (struct.unpack('<B', data))
            elif num_bits == 16:
                res_line += ', 0x%.2X' % (struct.unpack('<H', data))
            elif num_bits == 32:
                res_line += ', 0x%.2X' % (struct.unpack('<I', data))
        res_line += ')'
        res.append(res_line)
        print(res_line)
        r = buf.read(1)

    return res

decode_hid_descriptor(hori_pad)
