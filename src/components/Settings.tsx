import React, { useEffect } from 'react';
import { AudioFormat, AudioFormatUtil } from '../audioformats';
import * as userSettings from '../utils/userSettings';
import { Settings } from '../utils/userSettings';
import * as style from './Settings.module.css';

interface SettingsComponentProps {
  currentSettings: React.MutableRefObject<Settings>;
}

const SettingsComponent: React.FC<SettingsComponentProps> = ({ currentSettings }) => {

  const [, forceUpdate] = React.useState(0);

  const handleFormatChange = async (format: AudioFormat) => {
    const newSettings = currentSettings.current;
    newSettings.format = format;

    currentSettings.current = newSettings;
    await userSettings.saveSettings(newSettings);

    forceUpdate(prev => prev + 1);
  };

  const handleMaxDownloadConcurrencyChange = async (maxDownloadConcurency: number) => {
    if (maxDownloadConcurency >= 1 && maxDownloadConcurency <= 10) {
      const newSettings = currentSettings.current;
      newSettings.maxDownloadConcurency = maxDownloadConcurency;

      currentSettings.current = newSettings;
      await userSettings.saveSettings(newSettings);

      forceUpdate(prev => prev + 1);
    }
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
          value={currentSettings.current.format}
          onChange={(e) => handleFormatChange(e.target.value as AudioFormat)}
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
          value={currentSettings.current.maxDownloadConcurency}
          onChange={(e) => handleMaxDownloadConcurrencyChange(parseInt(e.target.value))}
        />
      </div>
    </div>
  );
};

export default SettingsComponent;
