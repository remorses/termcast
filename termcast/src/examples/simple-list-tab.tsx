import { renderExample } from '@termcast/api/src/utils'
import List from '@termcast/api/src/list'

const App: any = () => {
    return (
        <List 
            searchBarPlaceholder="Search... (Tab or ↓↑ to navigate)"
            filtering={true}
            onSelectionChange={(id) => {
                // logger.log(`Selected item: ${id}`)
            }}
        >
            <List.Item
                title="Dashboard"
                subtitle="View your main dashboard"
                keywords={['home', 'main', 'overview']}
                id="dashboard"
            />
            <List.Item
                title="Settings"
                subtitle="Configure your preferences"
                keywords={['config', 'preferences', 'options']}
                id="settings"
            />
            <List.Item
                title="Profile"
                subtitle="Manage your profile"
                keywords={['account', 'user', 'personal']}
                id="profile"
            />
            <List.Item
                title="Documentation"
                subtitle="Read the documentation"
                keywords={['docs', 'help', 'guide', 'manual']}
                id="docs"
            />
            <List.Item
                title="Support"
                subtitle="Get help from support team"
                keywords={['help', 'contact', 'assist']}
                id="support"
            />
            <List.Item
                title="Logout"
                subtitle="Sign out of your account"
                keywords={['signout', 'exit', 'leave']}
                id="logout"
            />
        </List>
    )
}

renderExample(<App />)