import * as style from "./Error.module.css"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import React from "react"

interface ErrorComponentProps {
    error: string;
}

const ErrorComponent: React.FC<ErrorComponentProps> = ({ error }) => {
    return (
        <div className={style.error}>
            <FontAwesomeIcon
                icon={faCircleExclamation}
                size="6x"
                className={style.icon}
            />
            <pre className={style.textError}>{error}</pre>
        </div>
    )
};

export default ErrorComponent;
