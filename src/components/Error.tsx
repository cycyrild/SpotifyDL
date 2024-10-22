import style from "./Error.module.css"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import React from "react"

interface CriticalErrorComponentProps {
    error: string;
}

const CriticalErrorComponent: React.FC<CriticalErrorComponentProps> = ({ error }) => {
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

export default CriticalErrorComponent;
