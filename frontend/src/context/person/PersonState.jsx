import PersonContext from "./PersonContext"

const PersonState = ({ children }) => {

    return (
        <PersonContext value={{}}>
            {children}
        </PersonContext>
    )
}
export default PersonState;