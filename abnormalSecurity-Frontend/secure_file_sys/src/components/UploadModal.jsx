const UploadModal = ({ onClose }) => {
    return (
        <div className="modal">
            <div className="modal-content">
                <h3>Upload File</h3>
                <form>
                    <div className="form-group">
                        <label>Choose File</label>
                        <input type="file" required />
                    </div>
                    <div className="modal-actions">
                        <button type="submit">Upload</button>
                        <button type="button" onClick={onClose}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UploadModal;