import { Form } from '@termcast/api/src/form/index'
import { TextField } from '@termcast/api/src/form/text-field'
import { PasswordField } from '@termcast/api/src/form/password-field'
import { TextArea } from '@termcast/api/src/form/text-area'
import { Checkbox } from '@termcast/api/src/form/checkbox'
import { Dropdown } from '@termcast/api/src/form/dropdown'
import { DatePicker } from '@termcast/api/src/form/date-picker'
import { Separator } from '@termcast/api/src/form/separator'
import { Description } from '@termcast/api/src/form/description'

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