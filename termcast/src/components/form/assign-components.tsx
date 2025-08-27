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
Form.TextField = TextField
Form.PasswordField = PasswordField
Form.TextArea = TextArea
Form.Checkbox = Checkbox
Form.Dropdown = Dropdown
Form.DatePicker = DatePicker
Form.TagPicker = null  // TODO: implement
Form.FilePicker = null  // TODO: implement
Form.Separator = Separator
Form.Description = Description