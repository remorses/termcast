import { Form } from './index'
import { TextField } from './text-field'
import { PasswordField } from './password-field'
import { TextArea } from './text-area'
import { Checkbox } from './checkbox'
import { Dropdown } from './dropdown'
import { DatePicker } from './date-picker'
import { Separator } from './separator'
import { Description } from './description'

// Assign all form components to Form object
Form.TextField = TextField as any
Form.PasswordField = PasswordField as any
Form.TextArea = TextArea as any
Form.Checkbox = Checkbox as any
Form.Dropdown = Dropdown
Form.DatePicker = DatePicker
Form.TagPicker = null // TODO: implement
Form.FilePicker = null // TODO: implement
Form.Separator = Separator
Form.Description = Description
