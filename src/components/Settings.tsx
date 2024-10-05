import React from 'react';
import { AudioFormat, AudioFormatUtil } from '../audioformats';
import * as userSettings from '../utils/userSettings';
import { Settings, isValidSettings } from '../utils/userSettings';
import * as style from './Settings.module.css';

interface SettingsComponentProps {
  currentSettings: React.MutableRefObject<Settings>;
}

const SettingsComponent: React.FC<SettingsComponentProps> = ({ currentSettings }) => {

  const [, forceUpdate] = React.useState(false);

  const handleSettingChange = async <T extends keyof Settings>(key: T, value: Settings[T]) => {
    const newSettings = { ...currentSettings.current };
    newSettings[key] = value;

    if (!isValidSettings(newSettings)) {
      console.error("Invalid settings", newSettings);
      return;
    }

    currentSettings.current = newSettings;
    await userSettings.saveSettings(newSettings);

    forceUpdate(prev => !prev);
  }

  return (
    <div className={style.settings} id="form">
      <div className={style.settingsFields}>
        <h3 className={style.titleSettings}>
          SETTINGS
        </h3>
        <div className={style.settingsGrid}>
          <label className={style.label} htmlFor="format-select">
            Audio quality
          </label>
          <select
            id="format-select"
            className={style.value}
            value={currentSettings.current.format}
            onChange={(e) => handleSettingChange('format', e.target.value as AudioFormat)}
          >
            {Object.values(AudioFormat)
              .map((format, index) => (
                <option key={index} value={format}>
                  {format}
                </option>
              ))}
          </select>
        </div>
        <div className={style.settingsGrid}>
          <label className={style.label} htmlFor="max-concurrent-input">
            Max concurrent downloads
          </label>
          <input
            id="max-concurrent-input"
            className={style.value}
            type="number"
            value={currentSettings.current.maxDownloadConcurrency}
            onChange={(e) => handleSettingChange('maxDownloadConcurrency', parseInt(e.target.value))}
          />
        </div>
        <div className={style.settingsGrid}>
          <label className={style.label} htmlFor="auto-convert-mp4-aac-input">
            Automatically convert to MP4 AAC
          </label>
          <input
            id="auto-convert-mp4-aac-input"
            className={style.value}
            type="checkbox"
            checked={currentSettings.current.autoConvertToMP4AAC}
            onChange={
              (e) => handleSettingChange('autoConvertToMP4AAC', e.target.checked)
            }
          />
        </div>
      </div>
      <hr className={style.horizontalRule} />


      <div className={style.settingsInformation}>
        {(currentSettings.current.autoConvertToMP4AAC === true && AudioFormatUtil.isAAC(currentSettings.current.format)) || (currentSettings.current.autoConvertToMP4AAC === false) ?
          <>
            <span>No audio re-encoding will be performed.</span><br />
          </>
          :
          <>
            <span>WARNING ‼️</span><br />
            <span>Audio {currentSettings.current.format} will be re-encoded, which may result in a loss of quality compared to the original file.</span>
          </>
        }
      </div>
    </div>
  );
};

export default SettingsComponent;
