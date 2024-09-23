import React, { useEffect } from 'react';
import { AudioFormat, AudioFormatUtil } from '../audioformats';
import * as userSettings from '../utils/userSettings';
import { Settings } from '../utils/userSettings';
import * as style from './Settings.module.css';

interface SettingsComponentProps {
  currentSettings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}

const SettingsComponent: React.FC<SettingsComponentProps> = ({ currentSettings, setSettings }) => {

  const handleFormatChange = async (format: AudioFormat) => {
    const newSettings = { ...currentSettings, format };
    setSettings(newSettings);
    await userSettings.saveSettings(newSettings);
  };

  const handleMaxDownloadConcurrencyChange = async (maxDownloadConcurency: number) => {
    const newSettings = { ...currentSettings, maxDownloadConcurency };
    setSettings(newSettings);
    await userSettings.saveSettings(newSettings);
  }

  return (
    <div className={style.settings} id="form">
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
          value={currentSettings.format}
          onChange={(e) => handleFormatChange(e.target.value as AudioFormat)}
        >
          {Object.values(AudioFormat)
            //.filter((x) => AudioFormatUtil.isAAC(x))
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
          value={currentSettings.maxDownloadConcurency}
          onChange={(e) => handleMaxDownloadConcurrencyChange(parseInt(e.target.value))}
        />
      </div>
    </div>
  );
};

export default SettingsComponent;
