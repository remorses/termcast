import { Form, Action, ActionPanel } from 'termcast'
import { showToast, Toast } from 'termcast'
import { useState } from 'react'
import { renderWithProviders } from '../utils'

const SimpleFilePicker = () => {
  const [submittedFiles, setSubmittedFiles] = useState<string[]>([])

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title='Submit Files'
            onSubmit={(values) => {
              const files = values.files as string[]
              setSubmittedFiles(files)
              showToast({
                style: Toast.Style.Success,
                title: 'Files Selected',
                message:
                  files.length > 0
                    ? `Selected ${files.length} file(s)`
                    : 'No files selected',
              })
            }}
          />
        </ActionPanel>
      }
    >
      <Form.TextField
        id='name'
        title='Your Name'
        placeholder='Enter your name'
        defaultValue='John Doe'
      />

      <Form.FilePicker
        id='files'
        title='Select Files'
        info='Choose one or more files to upload'
        allowMultipleSelection={true}
        canChooseFiles={true}
        canChooseDirectories={false}
      />

      <Form.FilePicker
        id='folder'
        title='Select Folder'
        info='Choose a folder for output'
        allowMultipleSelection={false}
        canChooseFiles={false}
        canChooseDirectories={true}
      />

      <Form.FilePicker
        id='singleFile'
        title='Select Single File'
        info='Choose exactly one file'
        allowMultipleSelection={false}
        canChooseFiles={true}
        canChooseDirectories={false}
      />

      {submittedFiles.length > 0 && (
        <Form.Description
          title='Last Submitted Files'
          text={submittedFiles.join('\n')}
        />
      )}
    </Form>
  )
}

renderWithProviders(<SimpleFilePicker />)
