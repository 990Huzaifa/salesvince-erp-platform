import { Save, Database, Server, Mail, Shield, Bell } from "lucide-react";
import { useState } from "react";
import { API_URL, PLATFORM_DOMAIN } from "../utils";
import { apiJson } from "../utils/api";
import { buildEmailAddress } from "../utils/helper";

export default function Settings() {
  const [connectionPoolSize, setConnectionPoolSize] = useState("50");
  const [maxConcurrentProvisions, setMaxConcurrentProvisions] = useState("5");
  const [provisioningTimeout, setProvisioningTimeout] = useState("300");
  const [sessionTimeout, setSessionTimeout] = useState("60");
  const [password, setPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (!password.trim()) {
      setPasswordError("Please enter a password.");
      return;
    }

    setPasswordSaving(true);

    try {
      await apiJson("platform/users/change-password", {
        method: "POST",
        body: JSON.stringify({ password: password.trim() }),
      });

      setPasswordSuccess("Password changed successfully.");
      setPassword("");
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Failed to change password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 style={{ color: '#21222D' }}>Platform Settings</h1>
        <p className="mt-1 text-sm" style={{ color: '#6B6C7E' }}>Configure global platform settings and preferences</p>
      </div>

      {/* API Configuration */}
      <div className="bg-white rounded-2xl p-6" style={{
        border: '1px solid rgba(219, 219, 229, 0.4)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="size-10 rounded-xl flex items-center justify-center" style={{
            backgroundColor: 'rgba(149, 140, 232, 0.1)',
            color: '#958CE8'
          }}>
            <Server className="size-5" />
          </div>
          <div>
            <h2 style={{ color: '#21222D' }}>API Configuration</h2>
            <p className="text-sm" style={{ color: '#6B6C7E' }}>Central base URL used by the app</p>
          </div>
        </div>

        <div>
          <label className="block text-sm mb-2" style={{ color: '#21222D' }}>API Base URL</label>
          <input
            type="text"
            value={API_URL}
            disabled
            className="w-full px-4 py-2.5 rounded-xl text-sm cursor-not-allowed"
            style={{
              backgroundColor: '#F8F9FC',
              color: '#6B6C7E',
              border: '1px solid rgba(219, 219, 229, 0.4)'
            }}
          />
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl p-6" style={{
        border: '1px solid rgba(219, 219, 229, 0.4)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="size-10 rounded-xl flex items-center justify-center" style={{
            backgroundColor: 'rgba(149, 140, 232, 0.1)',
            color: '#958CE8'
          }}>
            <Shield className="size-5" />
          </div>
          <div>
            <h2 style={{ color: '#21222D' }}>Change Password</h2>
            <p className="text-sm" style={{ color: '#6B6C7E' }}>Update your account password securely</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2" style={{ color: '#21222D' }}>New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full px-4 py-2.5 rounded-xl text-sm transition-all"
              style={{
                backgroundColor: 'white',
                color: '#21222D',
                border: '1px solid rgba(219, 219, 229, 0.4)'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#958CE8';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(149, 140, 232, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(219, 219, 229, 0.4)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {passwordError ? (
            <div className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: 'rgba(248, 113, 113, 0.3)', color: '#B91C1C', backgroundColor: '#FEF2F2' }}>
              {passwordError}
            </div>
          ) : null}

          {passwordSuccess ? (
            <div className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: 'rgba(52, 211, 153, 0.3)', color: '#15803D', backgroundColor: '#DCFCE7' }}>
              {passwordSuccess}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleChangePassword}
            disabled={passwordSaving}
            className="px-5 py-2.5 text-white rounded-xl font-medium text-sm transition-all disabled:cursor-not-allowed disabled:opacity-60"
            style={{ backgroundColor: '#958CE8' }}
            onMouseEnter={(e) => {
              if (!passwordSaving) {
                e.currentTarget.style.backgroundColor = '#8479D9';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(149, 140, 232, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#958CE8';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {passwordSaving ? 'Saving...' : 'Change Password'}
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-6" style={{ borderTop: '1px solid rgba(219, 219, 229, 0.4)' }}>
        <button className="px-5 py-2.5 rounded-xl font-medium text-sm transition-all" style={{ color: '#6B6C7E' }} onMouseEnter={(e) => e.currentTarget.style.color = '#21222D'} onMouseLeave={(e) => e.currentTarget.style.color = '#6B6C7E'}>
          Reset to Defaults
        </button>
        <button
          className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-medium text-sm transition-all"
          style={{ backgroundColor: '#958CE8' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#8479D9';
            e.currentTarget.style.boxShadow = '0 8px 16px rgba(149, 140, 232, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#958CE8';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <Save className="size-4" />
          Save Settings
        </button>
      </div>
    </div>
  );
}
