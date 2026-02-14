import React, { useEffect, useState } from "react";
import axios from "axios";
import OrgUnitTree from "./OrgUnitTree/OrgUnitTree";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Page from "./tabpages/age";
import { useAuth } from "../AuthContext";
import { Tabs } from "antd"; // import Tabs
import Gender from "./tabpages/gender";
import OrgUnit from'./tabpages/orgunit';
import Reaction from './tabpages/Reaction'
import Serious from'./tabpages/Serious'
import Fatal from "./tabpages/fatal";
import Reporter from "./tabpages/reporter";
import InitialDate from "./tabpages/initialDate"
import SeriousnessCriteria from './tabpages/SeriousnessCriteria'
const { TabPane } = Tabs;

const OrgUnitReport = () => {
   const { auth } = useAuth(); 
  const [rawOrgTree, setRawOrgTree] = useState([]);
  const [treeData, setTreeData] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10) // Jan 1 of current year
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().slice(0, 10) // today
  );
  const [reportParams, setReportParams] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);

  const convertToTreeNodes = (units) => {
    const convert = (nodes = []) =>
      nodes.map((u) => {
        const children = u.children ? convert(u.children) : [];
        const expanded =
          selectedOrg &&
          (children.some((c) => c.expanded) || u.id === selectedOrg?.value);

        return {
          label: u.displayName,
          value: u.id,
          level: u.level,
          children,
          isSelectable: true,
          checked: selectedOrg?.value === u.id,
          expanded,
          className: "selectable-node",
        };
      });

    return convert(units);
  };

const fetchOrgUnits = async () => {
  if (!auth?.username || !auth?.password) {
    toast.error("User not authenticated");
    setLoading(false);
    return;
  }

  const axiosAuth = {
    auth: {
      username: auth.username,
      password: auth.password,
    },
  };

  const toastId = toast.loading("ກຳລັງໂຫຼດໂຄງຮ່າງການຈັດຕັ້ງ...", {
    style: { fontFamily: "Noto Sans Lao, sans-serif", fontSize: "16px" },
  });

  try {
    const meRes = await axios.get(
      "https://dhis2.asia/laotracker/api/me.json",
      axiosAuth
    );

    const roots = meRes.data?.organisationUnits || [];

    const requests = roots.map((r) =>
      axios.get(
        `https://dhis2.asia/laotracker/api/organisationUnits/${r.id}.json`,
        {
          ...axiosAuth,
          params: {
            fields:
              "id,displayName,level,children[id,displayName,level,children[id,displayName,level,children[id,displayName,level]]]",
          },
        }
      )
    );

    const results = await Promise.all(requests);
    setRawOrgTree(results.map((r) => r.data));

    toast.update(toastId, {
      render: "ໂຫຼດຂໍ້ມູນສຳເລັດ",
      type: "success",
      isLoading: false,
      autoClose: 2000,
    });
  } catch (err) {
    console.error(err);
    toast.update(toastId, {
      render: "❌ ໂຫຼດຂໍ້ມູນບໍ່ສຳເລັດ",
      type: "error",
      isLoading: false,
    });
  }
};

  useEffect(() => {
    fetchOrgUnits();
  }, []);

  useEffect(() => {
    if (!rawOrgTree.length) return;
    setTreeData(convertToTreeNodes(rawOrgTree));
    setLoading(false);
  }, [rawOrgTree, selectedOrg]);

  const handleSelect = (_, selectedNodes) => {
    if (!selectedNodes?.length) return;
    setShowReport(false);

    const node = selectedNodes[0];
    setSelectedOrg({
      value: node.value,
      label: node.label,
      level: node.level,
    });
  };

  const handleGenerateReport = () => {
    if (!selectedOrg || !startDate || !endDate) return;

    setReportParams({
      orgUnitId: selectedOrg.value,
      orgUnitLabel: selectedOrg.label,
      orgUnitLevel: selectedOrg.level,
      startDate,
      endDate,
    });

    setShowReport(true);
  };

  return (
    <div style={{ fontFamily: "'Noto Sans Lao', sans-serif" }}>
      <ToastContainer position="top-right" theme="colored" />

      {!loading && (
        <div className="container py-3">
          <div className="d-flex gap-3 align-items-end flex-wrap no-print">
            <OrgUnitTree data={treeData} onChange={handleSelect} />

            {/* Start Date */}
            <div style={{ width: 200 }}>
              <label className="form-label mb-1">Start Date</label>
              <input
                type="date"
                className="form-control"
                value={startDate}
                max={endDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setShowReport(false);
                }}
              />
            </div>

            {/* End Date */}
            <div style={{ width: 200 }}>
              <label className="form-label mb-1">End Date</label>
              <input
                type="date"
                className="form-control"
                value={endDate}
                min={startDate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setShowReport(false);
                }}
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={handleGenerateReport}
              disabled={!selectedOrg || !startDate || !endDate || showReport}
            >
              ເອົາລາຍງານ
            </button>
          </div>

          {showReport && (
            <Tabs defaultActiveKey="1" type="card">
              <Tabs.TabPane tab="Patient age" key="1">
                <Page    orgUnitId={reportParams.orgUnitId}
                  startDate={reportParams.startDate}
                  endDate={reportParams.endDate} />
              </Tabs.TabPane>

              <Tabs.TabPane tab="Gender" key="2">
                <Gender
                  orgUnitId={reportParams.orgUnitId}
                  startDate={reportParams.startDate}
                  endDate={reportParams.endDate}
                />
              </Tabs.TabPane>
                   <Tabs.TabPane tab="Organization" key="3">
                <OrgUnit
                  orgUnitId={reportParams.orgUnitId}
                  startDate={reportParams.startDate}
                  endDate={reportParams.endDate}
                  orgUnitLevel={reportParams.orgUnitLevel}
                />
              </Tabs.TabPane>
                        <Tabs.TabPane tab="Reaction" key="4">
                <Reaction
                  orgUnitId={reportParams.orgUnitId}
                  startDate={reportParams.startDate}
                  endDate={reportParams.endDate}
                />
              </Tabs.TabPane>
                        <Tabs.TabPane tab="Serious" key="5">
                <Serious
                  orgUnitId={reportParams.orgUnitId}
                  startDate={reportParams.startDate}
                  endDate={reportParams.endDate}
                />
              </Tabs.TabPane>
                      <Tabs.TabPane tab="Fatal" key="6">
                <Fatal
                  orgUnitId={reportParams.orgUnitId}
                  startDate={reportParams.startDate}
                  endDate={reportParams.endDate}
                />
              </Tabs.TabPane>
                    <Tabs.TabPane tab="Reporter qualification" key="7">
                <Reporter
                  orgUnitId={reportParams.orgUnitId}
                  startDate={reportParams.startDate}
                  endDate={reportParams.endDate}
                />
              </Tabs.TabPane>
                                 <Tabs.TabPane tab="SeriousnessCriteria" key="8">
                <SeriousnessCriteria
                  orgUnitId={reportParams.orgUnitId}
                  startDate={reportParams.startDate}
                  endDate={reportParams.endDate}
                />
              </Tabs.TabPane>
                          <Tabs.TabPane tab="initial date" key="9">
                <InitialDate
                  orgUnitId={reportParams.orgUnitId}
                  startDate={reportParams.startDate}
                  endDate={reportParams.endDate}
                />
              </Tabs.TabPane>
            </Tabs>
          )}
        </div>
      )}
    </div>
  );
};

export default OrgUnitReport;
