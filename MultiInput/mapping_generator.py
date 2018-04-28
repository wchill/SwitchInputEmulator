EMPTY = -1

BUTTON_NONE = 0
BUTTON_Y = 1
BUTTON_B = 2
BUTTON_A = 4
BUTTON_X = 8
BUTTON_L = 16
BUTTON_R = 32
BUTTON_ZL = 64
BUTTON_ZR = 128
BUTTON_MINUS = 256
BUTTON_PLUS = 512
BUTTON_LCLICK = 1024
BUTTON_RCLICK = 2048
BUTTON_HOME = 4096
BUTTON_CAPTURE = 8192
BUTTON_ALL = 16383

STICK_MIN = 0
STICK_CENTER = 128
STICK_MAX = 255
STICK_LEFT = 0
STICK_RIGHT = 1

DPAD_UP = 0
DPAD_UP_RIGHT = 1
DPAD_RIGHT = 2
DPAD_DOWN_RIGHT = 3
DPAD_DOWN = 4
DPAD_DOWN_LEFT = 5
DPAD_LEFT = 6
DPAD_UP_LEFT = 7
DPAD_NONE = 8

PRESS_DELAY = 24
PRESS_RELEASE_DELAY = 8
HOLD_DELAY = 1
HOLD_RELEASE_DELAY = 1
MOVE_DELAY = 128
LOOK_DELAY = 64
ADJUST_DELAY = 16


def delay_to_ms(delay):
	return delay * 7.8125

class ControllerTransition:
	def __init__(self):
		self.dpad = None
		self.buttons_pressed = None
		self.buttons_released = None
		self.lx = None
		self.ly = None
		self.rx = None
		self.ry = None
		self.delay = 0

	def __str__(self):
		output = []
		output.append(str(self.lx) if self.lx is not None else '')
		output.append(str(self.ly) if self.ly is not None else '')
		output.append(str(self.rx) if self.rx is not None else '')
		output.append(str(self.ry) if self.ry is not None else '')
		output.append(str(self.buttons_pressed) if self.buttons_pressed is not None else '')
		output.append(str(self.buttons_released) if self.buttons_released is not None else '')
		output.append(str(self.dpad) if self.dpad is not None else '')
		output.append(str(self.delay))
		return ' : '.join(output)

class ControllerCommand:
	def __init__(self, names):
		self.names = names
		self.transitions = []
		self.undo_stack = []

	def __enter__(self):
		pass

	def __exit__(self, *args):
		if len(self.undo_stack) > 0:
			self.transitions.append(self.undo_stack.pop())
		else:
			raise Exception('Invalid transition on __exit__')

	def add_state(self, state):
		self.transitions.append(state)
		return self

	def press_buttons(self, *args, delay=PRESS_DELAY, release_delay=PRESS_RELEASE_DELAY):
		with self.hold_buttons(*args, delay=delay, release_delay=release_delay):
			pass
		return self

	def hold_buttons(self, *args, delay=HOLD_DELAY, release_delay=HOLD_RELEASE_DELAY):
		button = BUTTON_NONE
		for b in args:
			button |= b

		state = ControllerTransition()
		state.buttons_pressed = button
		state.delay = delay
		self.transitions.append(state)

		rel_state = ControllerTransition()
		rel_state.buttons_released = button
		rel_state.delay = release_delay
		self.undo_stack.append(rel_state)

		return self

	def release_buttons(self, *args, release_delay=HOLD_RELEASE_DELAY):
		button = BUTTON_NONE
		for b in args:
			button |= b
		rel_state = ControllerTransition()
		rel_state.buttons_released = button
		rel_state.delay = release_delay
		self.transitions.append(rel_state)

		return self

	def press_dpad(self, dpad, delay=PRESS_DELAY, release_delay=PRESS_RELEASE_DELAY):
		with self.hold_dpad(dpad, delay=delay, release_delay=release_delay):
			pass
		return self

	def hold_dpad(self, dpad, delay=HOLD_DELAY, release_delay=HOLD_RELEASE_DELAY):
		state = ControllerTransition()
		state.dpad = dpad
		state.delay = delay
		self.transitions.append(state)

		rel_state = ControllerTransition()
		rel_state.dpad = DPAD_NONE
		rel_state.delay = release_delay
		self.undo_stack.append(rel_state)

		return self

	def release_dpad(self, release_delay=HOLD_RELEASE_DELAY):
		rel_state = ControllerTransition()
		rel_state.dpad = DPAD_NONE
		rel_state.delay = release_delay
		self.transitions.append(rel_state)

		return self

	def move_stick(self, stick, x, y, delay=PRESS_DELAY, release_delay=PRESS_RELEASE_DELAY):
		with self.hold_stick(stick, x, y, delay=delay, release_delay=release_delay):
			pass
		return self

	def hold_stick(self, stick, x, y, delay=HOLD_DELAY, release_delay=HOLD_RELEASE_DELAY):
		state = ControllerTransition()
		if stick == STICK_LEFT:
			state.lx = x
			state.ly = y
		else:
			state.rx = x
			state.ry = y
		state.delay = delay
		self.transitions.append(state)

		rel_state = ControllerTransition()
		if stick == STICK_LEFT:
			rel_state.lx = STICK_CENTER if x is not None else None
			rel_state.ly = STICK_CENTER if y is not None else None
		else:
			rel_state.rx = STICK_CENTER if x is not None else None
			rel_state.ry = STICK_CENTER if y is not None else None
		rel_state.delay = release_delay
		self.undo_stack.append(rel_state)

		return self

	def release_stick(self, stick, x, y, release_delay=HOLD_RELEASE_DELAY):
		rel_state = ControllerTransition()
		if stick == STICK_LEFT:
			rel_state.lx = STICK_CENTER if x is not None else None
			rel_state.ly = STICK_CENTER if y is not None else None
		else:
			rel_state.rx = STICK_CENTER if x is not None else None
			rel_state.ry = STICK_CENTER if y is not None else None
		rel_state.delay = release_delay
		self.transitions.append(rel_state)

		return self

	def wait(self, delay):
		state = ControllerTransition()
		state.delay = delay
		self.transitions.append(state)

		return self

	def __str__(self):
		output = []
		output.append(' : '.join(self.names) + ' : %d' % len(self.transitions))
		for t in self.transitions:
			output.append(str(t))

		return '\n'.join(output)

class CommandHelp:
	def __init__(self, name, text, aliases=None, allowed=None):
		self.name = name
		self.aliases = aliases
		self.allowed = allowed
		self.text = text

	def __str__(self):
		if self.allowed:
			output = '* %s <parameter>\n' % self.name
		else:
			output = '* %s\n' % self.name
		if self.aliases:
			if isinstance(self.aliases, dict):
				aliases = self.aliases.get(self.name, None)
			else:
				aliases = self.aliases
			if aliases:
				output += '    * Aliases: *%s*\n' % ', '.join(aliases)
		output += '    * '
		if isinstance(self.text, str):
			output += self.text
		else:
			output += '\n    * '.join(self.text)
		if self.allowed:
			output += '\n    * Allowed parameters: `%s`' % ', '.join(self.allowed)
		return output + '\n'