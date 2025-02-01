import { useRef } from "react";
import useLoader from "./Loader";
import { API_URL } from "../App";
import { useSelector, useDispatch } from "react-redux";
import { setOwnerFiles } from "../redux/fileDataSlice";

async function calculateFileHash(file) {
    // Read the file as an ArrayBuffer
    const fileBuffer = await file.arrayBuffer();

    // Generate the hash using SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);

    // Convert the hash to a hexadecimal string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    console.log('Client-side hashHex:', hashHex);  // For debugging

    return hashHex;
}


const UploadModal = ({ onClose }) => {
    const fileUploadRef = useRef();
    const dispatch = useDispatch();

    const { loader, setIsLoading } = useLoader();
    const { auth } = useSelector(state => state.auth);
    const { owner_files_list } = useSelector(state => state.fileData);

    const handleFileUpload = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData();
        formData.append("file", fileUploadRef.current.files[0]);
        formData.append("hash", await calculateFileHash(fileUploadRef.current.files[0]));
        fetch(`${API_URL}/file/upload/`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${auth?.token}`,
            },
            body: formData,
        }).then(async (res) => {
            if (!res.ok) {
                throw new Error(await res.text());
            }
            return res.json();
        }).then((r) => {
            let newList = [...owner_files_list];
            newList.push(r.file);
            dispatch(setOwnerFiles({ owner_files_list: newList }));
        }).catch((e) => {
            console.log(e);
            alert(e.message);
        }).finally(() => {
            onClose();
            setIsLoading(false);
        });
    }
    return (
        <>
            {loader}
            <div className="modal">
                <div className="modal-content">
                    <h3>Upload File</h3>
                    <form>
                        <div className="form-group">
                            <label>Choose File</label>
                            <input ref={fileUploadRef} type="file" required />
                        </div>
                        <div className="modal-actions">
                            <button type="submit" onClick={handleFileUpload}>Upload</button>
                            <button type="button" onClick={onClose}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default UploadModal;