//frontend/src/components/inventory/WorkstationReport.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import WorkstationReportModal from "./WorkstationReportModal";
import WorkstationReportContent from "./WorkstationReportContent";

interface Workstation {
  workstation_id: number;
  workstation_name: string;
  lab_name: string | null;
  location: string | null;
  lab_id: number;
  assets: any[];
}

interface Props {
  show: boolean;
  onClose: () => void;
}

const WorkstationReport: React.FC<Props> = ({ show, onClose }) => {
  const { user } = useAuth();
  const [selectedLab, setSelectedLab] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [labs, setLabs] = useState<{ lab_id: number; lab_name: string }[]>([]);

  useEffect(() => {
    if (show && user?.role === "Custodian" && user.lab_id) {
      setSelectedLab(user.lab_id.toString());
    }
  }, [show, user]);

  useEffect(() => {
    if (show) {
      fetchLabs();
    }
  }, [show]);

  const fetchLabs = async () => {
    try {
      const response = await api.get("/laboratories");
      setLabs(response.data);
    } catch (error) {
      console.error("Failed to fetch labs:", error);
    }
  };

  return (
    <WorkstationReportModal
      show={show}
      onClose={onClose}
      selectedLab={selectedLab}
      setSelectedLab={setSelectedLab}
      labs={labs}
      workstations={workstations}
      user={user}
      loading={loading}
    >
      <WorkstationReportContent
        selectedLab={selectedLab}
        onLoadingChange={setLoading}
        onWorkstationsChange={setWorkstations}
      />
    </WorkstationReportModal>
  );
};

export default WorkstationReport;
