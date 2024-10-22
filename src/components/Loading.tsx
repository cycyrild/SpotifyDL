import style from "./Loading.module.css"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons';

import React from "react"

const LoadingComponent = () => {
    return (
        <div className={style.center}>
            <FontAwesomeIcon
              icon={faCircleNotch}
              size="6x"
              className={style.spin}
            />
          </div>
    )
}

export default LoadingComponent;