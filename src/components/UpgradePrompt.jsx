import { useNavigate } from 'react-router-dom'
import '../styles/UpgradePrompt.css'

export default function UpgradePrompt({ title, message, feature }) {
  const navigate = useNavigate()

  return (
    <div className="upgrade-prompt">
      <div className="upgrade-content">
        <h3>{title}</h3>
        <p>{message}</p>
        {feature && (
          <div className="upgrade-feature">
            <strong>Upgrade Benefits:</strong>
            <p>{feature}</p>
          </div>
        )}
      </div>
      <button onClick={() => navigate('/settings')} className="upgrade-button">
        View Plans
      </button>
    </div>
  )
}
