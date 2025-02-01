import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import useLoader from "../components/Loader";
import { setAuth } from "../redux/authSlice";
import { API_URL } from "../App";
import { useNavigate } from "react-router-dom";
import UploadModal from "../components/UploadModal";
import TableView from "../components/TableView";
import { setSharedFiles, setOwnerFiles } from "../redux/fileDataSlice";


const Dashboard = () => {
    const [activeTab, setActiveTab] = useState("myFiles");
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);
    const dispatch = useDispatch();

    const navigate = useNavigate();

    const { auth } = useSelector((state) => state.auth);
    const fileData = useSelector((state) => state.fileData);
    const { loader, setIsLoading } = useLoader();

    const handleTabChange = (tab) => setActiveTab(tab);
    const toggleUploadModal = () => setUploadModalOpen(!isUploadModalOpen);

    const handleLogout = () => {
        fetch(`${API_URL}/auth/logout/`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${auth?.token}`,
            },
        }).catch((e) => {
            console.log(e);
        }).finally(() => {
            dispatch(setAuth(null));
            navigate("/login");
            localStorage.removeItem("authData");
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
        }).then(async (res) => {
            if (!res.ok) {
                throw new Error(await res.text());
            }
            return res.json();
        }).then((r) => {
            dispatch(setSharedFiles({ shared_files_list: r.shared_files }));
            dispatch(setOwnerFiles({ owner_files_list: r.owner_files }));
        }).catch((e) => {
            console.log(e);
            dispatch(setAuth(null));
            navigate("/login");
            localStorage.removeItem("authData");
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
                            files={fileData.owner_files_list}
                            activeTab={activeTab}
                        />
                    )}
                    {activeTab === "sharedFiles" && (
                        <TableView
                            title="Shared Files"
                            files={fileData.shared_files_list}
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

export default Dashboard;
