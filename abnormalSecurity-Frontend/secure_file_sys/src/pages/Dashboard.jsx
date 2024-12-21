import { useState, useEffect } from "react";
import { useAuth } from "../components/AuthProvider";
import useLoader from "../components/Loader";
import { API_URL } from "../App";
import { useNavigate } from "react-router-dom";
import UploadModal from "../components/UploadModal";

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState("myFiles");
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);
    const [filesData, setFilesData] = useState({
        shared_files: [],
        owner_files: []
    });

    const navigate = useNavigate();

    const { auth, setAuth } = useAuth();
    const { loader, setIsLoading } = useLoader();

    const handleTabChange = (tab) => setActiveTab(tab);
    const toggleUploadModal = () => setUploadModalOpen(!isUploadModalOpen);

    const handleLogout = () => {
        navigate("/login");
        fetch(`${API_URL}/auth/logout/`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${auth?.token}`,
            },
        }).catch((e) => {
            console.log(e);
        }).finally(() => {
            setAuth(null);
        });
    };

    useEffect(() => {
        document.title = "Dashboard";
        setIsLoading(true);
        fetch(`${API_URL}/file/list/`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${auth?.token}`,
            },
        }).then((res) => res.json()).then((r) => {
            setFilesData(r);
        }).catch((e) => {
            console.log(e);
        }).finally(() => {
            setIsLoading(false);
        });
    }, []);

    return (
        <>
            {loader}
            <div className="dashboard">
                {/* Tab Navigation */}
                <div className="tabs">
                    <button
                        className={activeTab === "myFiles" ? "active" : ""}
                        onClick={() => handleTabChange("myFiles")}
                    >
                        My Files
                    </button>
                    <button
                        className={activeTab === "sharedFiles" ? "active" : ""}
                        onClick={() => handleTabChange("sharedFiles")}
                    >
                        Shared Files
                    </button>
                </div>

                {/* Tab Content */}
                <div className="tab-content">
                    {activeTab === "myFiles" && (
                        <TableView
                            title="My Files"
                            files={filesData.owner_files}
                            activeTab={activeTab}
                        />
                    )}
                    {activeTab === "sharedFiles" && (
                        <TableView
                            title="Shared Files"
                            files={filesData.shared_files}
                            activeTab={activeTab}
                        />
                    )}
                </div>

                {/* Upload Button */}
                <button className="upload-btn" onClick={toggleUploadModal}>
                    Upload File
                </button>

                {/* Logout Button */}
                <button className="logout-btn" onClick={handleLogout}>
                    Logout
                </button>

                {/* Upload Modal */}
                {isUploadModalOpen && (
                    <UploadModal onClose={toggleUploadModal} />
                )}
            </div>
        </>
    );
};

const TableView = ({ title, files, activeTab }) => {
    return (
        <div className="table-view">
            <h3>{title}</h3>
            <table>
                <thead>
                    <tr>
                        <th>File Name</th>
                        <th>File Owner</th>
                        {activeTab === "myFiles" && <th>Manage Access</th>}
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
                                    <button>Manage</button>
                                </td>
                            }
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Dashboard;
