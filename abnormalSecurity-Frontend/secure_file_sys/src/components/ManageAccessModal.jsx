import useLoader from "./Loader";
import { useSelector, useDispatch } from "react-redux";
import { setAccessUsers } from "../redux/accessUsers.js";
import { API_URL } from "../App";

const ManageAccessModal = ({ onClose, fileId }) => {
    const { loader, setIsLoading } = useLoader();
    const { accessUsers } = useSelector(state => state.accessUsers);
    const dispatch = useDispatch();
    const { auth } = useSelector(state => state.auth);

    const handleUserAccessAdd = (e) => {
        e.preventDefault();
        dispatch(setAccessUsers([...accessUsers, { id: accessUsers.length + 1, name: "User" + (accessUsers.length + 1), email: "" }]));
    }


    const handleInputUpdate = (e, i) => {
        let newList = JSON.parse(JSON.stringify(accessUsers));
        newList[i].email = e.target.value;
        dispatch(setAccessUsers(newList));
    }

    const handleUserAccessSubmit = (e) => {
        setIsLoading(true);
        e.preventDefault();
        fetch(`${API_URL}/file/share/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${auth?.token}`
            },
            body: JSON.stringify({
                id: fileId,
                userList: accessUsers.map(user => user.email)
            })
        }).catch((e) => {
            alert(e.message);
        }).finally(() => {
            setIsLoading(false);
            onClose();
        });
    }

    return (
        <>
            {loader}
            <div className="modal">
                <div className="modal-content">
                    <h3>Manage Access</h3>
                    <form>
                        <div className="form-group">
                            {accessUsers.map((user, index) => (
                                <div key={user.id} className="access-user" style={{ display: "flex", justifyContent: "space-between" }}>
                                    <input type="text" value={user.email} onChange={(e) => handleInputUpdate(e, index)} />
                                    <span style={{ alignSelf: "center" }}><button onClick={() => dispatch(setAccessUsers(accessUsers.filter(u => u.id !== user.id)))}>X</button></span>
                                </div>
                            ))}
                        </div>
                        <div className="modal-actions">
                            <button className="add-user" onClick={handleUserAccessAdd}>Add User</button>
                            <button type="submit" onClick={handleUserAccessSubmit}>Submit</button>
                            <button type="button" onClick={onClose}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

export default ManageAccessModal;