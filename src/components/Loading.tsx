import style from "./Loading.module.css"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@lib/pro-solid-svg-icons';

import React from "react"

const LoadingComponent = () => {
    return (
        <div className={style.center}>
            <FontAwesomeIcon
              icon={faSpinner}
              size="6x"
              className={style.spin}
            />
          </div>
    )
}

export default LoadingComponent;