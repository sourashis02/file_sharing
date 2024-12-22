import { useSelector, useDispatch } from "react-redux";
import { useState } from "react";
import { API_URL } from "../App";
import useLoader from "./Loader";
import ManageAccessModal from "./ManageAccessModal";
import { setAccessUsers } from "../redux/accessUsers.js";

const TableView = ({ title, files, activeTab }) => {
    const [modalData, setModalData] = useState({
        fileId: null,
        isOpen: false
    });
    const { auth } = useSelector(state => state.auth);
    const { loader, setIsLoading } = useLoader();
    const dispatch = useDispatch();

    const handleDownload = (fileId) => {
        setIsLoading(true);
        fetch(`${API_URL}/file/download/${fileId}/`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${auth?.token}`,
            },
        }).then((res) => res.blob()).then((blob) => {
            setIsLoading(false);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = files.find(file => file.id === fileId).file_name;
            a.click();
        }).catch((e) => {
            setIsLoading(false);
            alert(e.message);
            console.log(e);
        })
    }


    const handleManageAccessModal = (fileId) => {
        setIsLoading(true);
        fetch(`${API_URL}/file/sharedwith/${fileId}/`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${auth?.token}`,
            },
        }).then((res) => res.json()).then((r) => {
            dispatch(setAccessUsers(r.users));
            setIsLoading(false);
            setModalData({
                fileId: fileId,
                isOpen: true
            });
        }).catch((e) => {
            console.log(e);
            setIsLoading(false);
        });
    }


    return (
        <>
            {loader}
            <div className="table-view">
                <h3>{title}</h3>
                <table>
                    <thead>
                        <tr>
                            <th>File Name</th>
                            <th>File Owner</th>
                            {activeTab === "myFiles" && <th>Manage Access</th>}
                            <th>Download</th>
                        </tr>
                    </thead>
                    <tbody>
                        {files.map(file => (
                            <tr key={file.id}>
                                <td>{file.file_name}</td>
                                <td>{file.owner}</td>
                                {
                                    activeTab === "myFiles" &&
                                    <td>
                                        <button onClick={() => handleManageAccessModal(file.id)}>Manage</button>
                                    </td>
                                }
                                <td>
                                    <button onClick={() => handleDownload(file.id)}>Download</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {
                modalData.isOpen &&
                <ManageAccessModal onClose={() => setModalData({ fileId: null, isOpen: false })} fileId={modalData.fileId} />
            }
        </>
    );
};

export default TableView;