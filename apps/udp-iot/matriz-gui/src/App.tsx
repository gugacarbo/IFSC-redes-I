import { useState } from 'react'
import { Layout } from './components/layout'
import { Dashboard } from './components/dashboard'
import { ConfigView } from './components/config'
import { useIoT } from './hooks/useIoT'

function App() {
  const [tab, setTab] = useState('dashboard')
  const { filiais, connected, sendCommand } = useIoT()

  return (
    <Layout currentTab={tab} setTab={setTab}>
      {!connected && (
        <div className="bg-red-100 text-red-800 p-3 rounded mb-4 text-sm text-center">
          Desconectado da Matriz. Tentando reconectar...
        </div>
      )}
      
      {tab === 'dashboard' ? (
        <Dashboard filiais={filiais} onCommand={sendCommand} />
      ) : (
        <ConfigView />
      )}
    </Layout>
  )
}

export default App
