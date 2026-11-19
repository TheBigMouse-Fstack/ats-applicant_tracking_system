import xml.etree.ElementTree as ET

as_is_bpmn_content = '''<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  xmlns:bioc="http://bpmn.io/schema/bpmn/biocolor/1.0"
                  xmlns:color="http://www.omg.org/spec/BPMN/non-normative/color/1.0"
                  id="Definitions_ATS_Recruitment_AsIs"
                  targetNamespace="http://bpmn.io/schema/bpmn"
                  exporter="Antigravity BPMN 2.0 Generator"
                  exporterVersion="2.2.0">

  <bpmn:collaboration id="Collaboration_AsIs_Recruitment">
    <bpmn:participant id="Participant_AsIsProcess" name="AS-IS MANUAL RECRUITMENT WORKFLOW (LEGACY)" processRef="Process_AsIs_Recruitment" />
  </bpmn:collaboration>

  <bpmn:process id="Process_AsIs_Recruitment" name="Legacy Manual Recruitment Process" isExecutable="false">
    
    <!-- LANE SET: SINGLE ACTOR (RECRUITER / HR) -->
    <bpmn:laneSet id="LaneSet_AsIs">
      <bpmn:lane id="Lane_HRRecruiter" name="HR Recruiter / Hiring Specialist">
        <bpmn:flowNodeRef>Start_ReceiveApplications</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_DownloadSaveCV</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_LogDataExcel</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_ScreenMatchJD</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_ScreeningPass</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_UpdateExcelRejectCV</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_SendRejectEmailCV</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_RejectCV</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_ScheduleManualInterview</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_ConductInterviewNotes</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_InterviewResult</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_UpdateExcelPassed</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_SendOfferLetter</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_HiredSuccess</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_UpdateExcelFailInterview</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_SendRejectEmailInterview</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_FailInterview</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>

    <!-- DATA OBJECTS & DATA STORES -->
    <bpmn:dataStoreReference id="DataStore_LocalFolder" name="Local Computer Folder (CV Files)" />
    <bpmn:dataStoreReference id="DataStore_ExcelSpreadsheet" name="Recruitment Tracking Excel File" />

    <!-- 1. START EVENT -->
    <bpmn:startEvent id="Start_ReceiveApplications" name="Receive candidate CVs via Email/Job Portals">
      <bpmn:outgoing>Flow_Start_To_Download</bpmn:outgoing>
    </bpmn:startEvent>

    <!-- 2. INTAKE & LOGGING TASKS -->
    <bpmn:userTask id="Task_DownloadSaveCV" name="1. Download &amp; save CV to local computer folder">
      <bpmn:incoming>Flow_Start_To_Download</bpmn:incoming>
      <bpmn:outgoing>Flow_Download_To_LogExcel</bpmn:outgoing>
      <bpmn:dataOutputAssociation id="DataOutput_SaveToFolder">
        <bpmn:targetRef>DataStore_LocalFolder</bpmn:targetRef>
      </bpmn:dataOutputAssociation>
    </bpmn:userTask>

    <bpmn:userTask id="Task_LogDataExcel" name="2. Read PDF &amp; manually type candidate details into Excel">
      <bpmn:incoming>Flow_Download_To_LogExcel</bpmn:incoming>
      <bpmn:outgoing>Flow_LogExcel_To_Screen</bpmn:outgoing>
      <bpmn:dataOutputAssociation id="DataOutput_SaveToExcel">
        <bpmn:targetRef>DataStore_ExcelSpreadsheet</bpmn:targetRef>
      </bpmn:dataOutputAssociation>
    </bpmn:userTask>

    <!-- 3. SCREENING TASK -->
    <bpmn:userTask id="Task_ScreenMatchJD" name="3. Manually screen &amp; match CV profile against JD requirements">
      <bpmn:incoming>Flow_LogExcel_To_Screen</bpmn:incoming>
      <bpmn:outgoing>Flow_Screen_To_Gateway</bpmn:outgoing>
      <bpmn:property id="Prop_ExcelScreen" name="__targetRef_placeholder" />
      <bpmn:dataInputAssociation id="DataInput_ReadFromExcel">
        <bpmn:sourceRef>DataStore_ExcelSpreadsheet</bpmn:sourceRef>
        <bpmn:targetRef>Prop_ExcelScreen</bpmn:targetRef>
      </bpmn:dataInputAssociation>
    </bpmn:userTask>

    <bpmn:exclusiveGateway id="Gateway_ScreeningPass" name="Profile meets initial criteria?">
      <bpmn:incoming>Flow_Screen_To_Gateway</bpmn:incoming>
      <bpmn:outgoing>Flow_Screen_Pass</bpmn:outgoing>
      <bpmn:outgoing>Flow_Screen_Reject</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <!-- 4. CV REJECTION BRANCH -->
    <bpmn:userTask id="Task_UpdateExcelRejectCV" name="4A. Update status to 'Rejected CV' in Excel">
      <bpmn:incoming>Flow_Screen_Reject</bpmn:incoming>
      <bpmn:outgoing>Flow_UpdateExcel_To_SendEmail1</bpmn:outgoing>
      <bpmn:dataOutputAssociation id="DataOutput_UpdateRej1">
        <bpmn:targetRef>DataStore_ExcelSpreadsheet</bpmn:targetRef>
      </bpmn:dataOutputAssociation>
    </bpmn:userTask>

    <bpmn:sendTask id="Task_SendRejectEmailCV" name="5A. Manually draft &amp; send rejection email to candidate">
      <bpmn:incoming>Flow_UpdateExcel_To_SendEmail1</bpmn:incoming>
      <bpmn:outgoing>Flow_SendEmail1_To_End</bpmn:outgoing>
    </bpmn:sendTask>

    <bpmn:endEvent id="End_RejectCV" name="Closed: Disqualified at CV Stage">
      <bpmn:incoming>Flow_SendEmail1_To_End</bpmn:incoming>
    </bpmn:endEvent>

    <!-- 5. INTERVIEW SCHEDULING & EVALUATION -->
    <bpmn:userTask id="Task_ScheduleManualInterview" name="4B. Contact candidate by phone/email &amp; arrange interview schedule">
      <bpmn:incoming>Flow_Screen_Pass</bpmn:incoming>
      <bpmn:outgoing>Flow_Schedule_To_Conduct</bpmn:outgoing>
    </bpmn:userTask>

    <bpmn:manualTask id="Task_ConductInterviewNotes" name="5B. Conduct interview &amp; take manual paper evaluation notes">
      <bpmn:incoming>Flow_Schedule_To_Conduct</bpmn:incoming>
      <bpmn:outgoing>Flow_Conduct_To_Gateway</bpmn:outgoing>
    </bpmn:manualTask>

    <bpmn:exclusiveGateway id="Gateway_InterviewResult" name="Hiring assessment result?">
      <bpmn:incoming>Flow_Conduct_To_Gateway</bpmn:incoming>
      <bpmn:outgoing>Flow_Interview_Pass</bpmn:outgoing>
      <bpmn:outgoing>Flow_Interview_Fail</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <!-- 6. HIRED BRANCH -->
    <bpmn:userTask id="Task_UpdateExcelPassed" name="6A. Update candidate status to 'Passed' in Excel">
      <bpmn:incoming>Flow_Interview_Pass</bpmn:incoming>
      <bpmn:outgoing>Flow_UpdatePassed_To_Offer</bpmn:outgoing>
      <bpmn:dataOutputAssociation id="DataOutput_UpdatePassed">
        <bpmn:targetRef>DataStore_ExcelSpreadsheet</bpmn:targetRef>
      </bpmn:dataOutputAssociation>
    </bpmn:userTask>

    <bpmn:sendTask id="Task_SendOfferLetter" name="7A. Compose &amp; send official Job Offer Letter via email">
      <bpmn:incoming>Flow_UpdatePassed_To_Offer</bpmn:incoming>
      <bpmn:outgoing>Flow_Offer_To_EndHired</bpmn:outgoing>
    </bpmn:sendTask>

    <bpmn:endEvent id="End_HiredSuccess" name="Closed: Candidate Successfully Hired">
      <bpmn:incoming>Flow_Offer_To_EndHired</bpmn:incoming>
    </bpmn:endEvent>

    <!-- 7. INTERVIEW REJECTION BRANCH -->
    <bpmn:userTask id="Task_UpdateExcelFailInterview" name="6B. Update candidate status to 'Failed' in Excel">
      <bpmn:incoming>Flow_Interview_Fail</bpmn:incoming>
      <bpmn:outgoing>Flow_UpdateFail_To_SendRej2</bpmn:outgoing>
      <bpmn:dataOutputAssociation id="DataOutput_UpdateFail">
        <bpmn:targetRef>DataStore_ExcelSpreadsheet</bpmn:targetRef>
      </bpmn:dataOutputAssociation>
    </bpmn:userTask>

    <bpmn:sendTask id="Task_SendRejectEmailInterview" name="7B. Compose &amp; send regret email to candidate">
      <bpmn:incoming>Flow_UpdateFail_To_SendRej2</bpmn:incoming>
      <bpmn:outgoing>Flow_SendRej2_To_EndFail</bpmn:outgoing>
    </bpmn:sendTask>

    <bpmn:endEvent id="End_FailInterview" name="Closed: Disqualified after Interview">
      <bpmn:incoming>Flow_SendRej2_To_EndFail</bpmn:incoming>
    </bpmn:endEvent>

    <!-- SEQUENCE FLOWS -->
    <bpmn:sequenceFlow id="Flow_Start_To_Download" sourceRef="Start_ReceiveApplications" targetRef="Task_DownloadSaveCV" />
    <bpmn:sequenceFlow id="Flow_Download_To_LogExcel" sourceRef="Task_DownloadSaveCV" targetRef="Task_LogDataExcel" />
    <bpmn:sequenceFlow id="Flow_LogExcel_To_Screen" sourceRef="Task_LogDataExcel" targetRef="Task_ScreenMatchJD" />
    <bpmn:sequenceFlow id="Flow_Screen_To_Gateway" sourceRef="Task_ScreenMatchJD" targetRef="Gateway_ScreeningPass" />
    <bpmn:sequenceFlow id="Flow_Screen_Reject" name="Does not meet criteria" sourceRef="Gateway_ScreeningPass" targetRef="Task_UpdateExcelRejectCV" />
    <bpmn:sequenceFlow id="Flow_Screen_Pass" name="Meets requirements" sourceRef="Gateway_ScreeningPass" targetRef="Task_ScheduleManualInterview" />
    <bpmn:sequenceFlow id="Flow_UpdateExcel_To_SendEmail1" sourceRef="Task_UpdateExcelRejectCV" targetRef="Task_SendRejectEmailCV" />
    <bpmn:sequenceFlow id="Flow_SendEmail1_To_End" sourceRef="Task_SendRejectEmailCV" targetRef="End_RejectCV" />
    <bpmn:sequenceFlow id="Flow_Schedule_To_Conduct" sourceRef="Task_ScheduleManualInterview" targetRef="Task_ConductInterviewNotes" />
    <bpmn:sequenceFlow id="Flow_Conduct_To_Gateway" sourceRef="Task_ConductInterviewNotes" targetRef="Gateway_InterviewResult" />
    <bpmn:sequenceFlow id="Flow_Interview_Pass" name="Passed Interview" sourceRef="Gateway_InterviewResult" targetRef="Task_UpdateExcelPassed" />
    <bpmn:sequenceFlow id="Flow_Interview_Fail" name="Failed Interview" sourceRef="Gateway_InterviewResult" targetRef="Task_UpdateExcelFailInterview" />
    <bpmn:sequenceFlow id="Flow_UpdatePassed_To_Offer" sourceRef="Task_UpdateExcelPassed" targetRef="Task_SendOfferLetter" />
    <bpmn:sequenceFlow id="Flow_Offer_To_EndHired" sourceRef="Task_SendOfferLetter" targetRef="End_HiredSuccess" />
    <bpmn:sequenceFlow id="Flow_UpdateFail_To_SendRej2" sourceRef="Task_UpdateExcelFailInterview" targetRef="Task_SendRejectEmailInterview" />
    <bpmn:sequenceFlow id="Flow_SendRej2_To_EndFail" sourceRef="Task_SendRejectEmailInterview" targetRef="End_FailInterview" />

  </bpmn:process>

  <!-- DIAGRAM DISPLAY / GRAPHICAL COORDINATES (DI) -->
  <bpmndi:BPMNDiagram id="BPMNDiagram_AsIs">
    <bpmndi:BPMNPlane id="BPMNPlane_AsIs" bpmnElement="Collaboration_AsIs_Recruitment">
      
      <!-- PARTICIPANT POOL -->
      <bpmndi:BPMNShape id="Participant_AsIsProcess_di" bpmnElement="Participant_AsIsProcess" isHorizontal="true">
        <dc:Bounds x="160" y="80" width="1560" height="600" />
      </bpmndi:BPMNShape>

      <!-- LANE -->
      <bpmndi:BPMNShape id="Lane_HRRecruiter_di" bpmnElement="Lane_HRRecruiter" isHorizontal="true">
        <dc:Bounds x="190" y="80" width="1530" height="600" />
      </bpmndi:BPMNShape>

      <!-- DATA STORES (BOTTLENECK SILOS - HIGHLIGHTED RED) -->
      <bpmndi:BPMNShape id="DataStore_LocalFolder_di" bpmnElement="DataStore_LocalFolder"
                        bioc:stroke="#e11d48" bioc:fill="#ffe4e6"
                        color:border-color="#e11d48" color:background-color="#ffe4e6">
        <dc:Bounds x="375" y="105" width="50" height="50" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="357" y="162" width="87" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="DataStore_ExcelSpreadsheet_di" bpmnElement="DataStore_ExcelSpreadsheet"
                        bioc:stroke="#e11d48" bioc:fill="#ffe4e6"
                        color:border-color="#e11d48" color:background-color="#ffe4e6">
        <dc:Bounds x="575" y="385" width="50" height="50" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="557" y="442" width="86" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <!-- START EVENT -->
      <bpmndi:BPMNShape id="Start_ReceiveApplications_di" bpmnElement="Start_ReceiveApplications">
        <dc:Bounds x="242" y="242" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="217" y="285" width="87" height="40" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <!-- TASKS -->
      <bpmndi:BPMNShape id="Task_DownloadSaveCV_di" bpmnElement="Task_DownloadSaveCV">
        <dc:Bounds x="325" y="220" width="150" height="80" />
      </bpmndi:BPMNShape>

      <!-- BOTTLENECK 1: MANUAL DATA ENTRY -->
      <bpmndi:BPMNShape id="Task_LogDataExcel_di" bpmnElement="Task_LogDataExcel"
                        bioc:stroke="#e11d48" bioc:fill="#ffe4e6"
                        color:border-color="#e11d48" color:background-color="#ffe4e6">
        <dc:Bounds x="525" y="220" width="150" height="80" />
      </bpmndi:BPMNShape>

      <!-- BOTTLENECK 2: MANUAL JD MATCHING -->
      <bpmndi:BPMNShape id="Task_ScreenMatchJD_di" bpmnElement="Task_ScreenMatchJD"
                        bioc:stroke="#e11d48" bioc:fill="#ffe4e6"
                        color:border-color="#e11d48" color:background-color="#ffe4e6">
        <dc:Bounds x="725" y="220" width="150" height="80" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Gateway_ScreeningPass_di" bpmnElement="Gateway_ScreeningPass" isMarkerVisible="true">
        <dc:Bounds x="925" y="235" width="50" height="50" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="912" y="292" width="77" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <!-- REJECT CV BRANCH -->
      <bpmndi:BPMNShape id="Task_UpdateExcelRejectCV_di" bpmnElement="Task_UpdateExcelRejectCV">
        <dc:Bounds x="1025" y="110" width="150" height="80" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_SendRejectEmailCV_di" bpmnElement="Task_SendRejectEmailCV">
        <dc:Bounds x="1225" y="110" width="150" height="80" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="End_RejectCV_di" bpmnElement="End_RejectCV">
        <dc:Bounds x="1432" y="132" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="1407" y="175" width="87" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <!-- INTERVIEW BRANCH -->
      <!-- BOTTLENECK 3: EMAIL PING-PONG SCHEDULING -->
      <bpmndi:BPMNShape id="Task_ScheduleManualInterview_di" bpmnElement="Task_ScheduleManualInterview"
                        bioc:stroke="#e11d48" bioc:fill="#ffe4e6"
                        color:border-color="#e11d48" color:background-color="#ffe4e6">
        <dc:Bounds x="1025" y="220" width="150" height="80" />
      </bpmndi:BPMNShape>

      <!-- BOTTLENECK 4: UNSTRUCTURED PAPER EVALUATION -->
      <bpmndi:BPMNShape id="Task_ConductInterviewNotes_di" bpmnElement="Task_ConductInterviewNotes"
                        bioc:stroke="#e11d48" bioc:fill="#ffe4e6"
                        color:border-color="#e11d48" color:background-color="#ffe4e6">
        <dc:Bounds x="1025" y="340" width="150" height="80" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Gateway_InterviewResult_di" bpmnElement="Gateway_InterviewResult" isMarkerVisible="true">
        <dc:Bounds x="1075" y="465" width="50" height="50" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="1000" y="476" width="67" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <!-- PASSED BRANCH -->
      <bpmndi:BPMNShape id="Task_UpdateExcelPassed_di" bpmnElement="Task_UpdateExcelPassed">
        <dc:Bounds x="1185" y="450" width="150" height="80" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_SendOfferLetter_di" bpmnElement="Task_SendOfferLetter">
        <dc:Bounds x="1385" y="450" width="150" height="80" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="End_HiredSuccess_di" bpmnElement="End_HiredSuccess">
        <dc:Bounds x="1592" y="472" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="1576" y="515" width="69" height="40" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <!-- FAILED INTERVIEW BRANCH -->
      <bpmndi:BPMNShape id="Task_UpdateExcelFailInterview_di" bpmnElement="Task_UpdateExcelFailInterview">
        <dc:Bounds x="1185" y="560" width="150" height="80" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_SendRejectEmailInterview_di" bpmnElement="Task_SendRejectEmailInterview">
        <dc:Bounds x="1385" y="560" width="150" height="80" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="End_FailInterview_di" bpmnElement="End_FailInterview">
        <dc:Bounds x="1592" y="582" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="1568" y="625" width="85" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <!-- EDGES -->
      <bpmndi:BPMNEdge id="Flow_Start_To_Download_di" bpmnElement="Flow_Start_To_Download">
        <di:waypoint x="278" y="260" />
        <di:waypoint x="325" y="260" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_Download_To_LogExcel_di" bpmnElement="Flow_Download_To_LogExcel">
        <di:waypoint x="475" y="260" />
        <di:waypoint x="525" y="260" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_LogExcel_To_Screen_di" bpmnElement="Flow_LogExcel_To_Screen">
        <di:waypoint x="675" y="260" />
        <di:waypoint x="725" y="260" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_Screen_To_Gateway_di" bpmnElement="Flow_Screen_To_Gateway">
        <di:waypoint x="875" y="260" />
        <di:waypoint x="925" y="260" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_Screen_Reject_di" bpmnElement="Flow_Screen_Reject">
        <di:waypoint x="950" y="235" />
        <di:waypoint x="950" y="150" />
        <di:waypoint x="1025" y="150" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="956" y="166" width="67" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_Screen_Pass_di" bpmnElement="Flow_Screen_Pass">
        <di:waypoint x="975" y="260" />
        <di:waypoint x="1025" y="260" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="965" y="238" width="65" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_UpdateExcel_To_SendEmail1_di" bpmnElement="Flow_UpdateExcel_To_SendEmail1">
        <di:waypoint x="1175" y="150" />
        <di:waypoint x="1225" y="150" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_SendEmail1_To_End_di" bpmnElement="Flow_SendEmail1_To_End">
        <di:waypoint x="1375" y="150" />
        <di:waypoint x="1432" y="150" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_Schedule_To_Conduct_di" bpmnElement="Flow_Schedule_To_Conduct">
        <di:waypoint x="1100" y="300" />
        <di:waypoint x="1100" y="340" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_Conduct_To_Gateway_di" bpmnElement="Flow_Conduct_To_Gateway">
        <di:waypoint x="1100" y="420" />
        <di:waypoint x="1100" y="465" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_Interview_Pass_di" bpmnElement="Flow_Interview_Pass">
        <di:waypoint x="1125" y="490" />
        <di:waypoint x="1185" y="490" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="1120" y="468" width="55" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_Interview_Fail_di" bpmnElement="Flow_Interview_Fail">
        <di:waypoint x="1100" y="515" />
        <di:waypoint x="1100" y="600" />
        <di:waypoint x="1185" y="600" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="1106" y="555" width="55" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_UpdatePassed_To_Offer_di" bpmnElement="Flow_UpdatePassed_To_Offer">
        <di:waypoint x="1335" y="490" />
        <di:waypoint x="1385" y="490" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_Offer_To_EndHired_di" bpmnElement="Flow_Offer_To_EndHired">
        <di:waypoint x="1535" y="490" />
        <di:waypoint x="1592" y="490" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_UpdateFail_To_SendRej2_di" bpmnElement="Flow_UpdateFail_To_SendRej2">
        <di:waypoint x="1335" y="600" />
        <di:waypoint x="1385" y="600" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_SendRej2_To_EndFail_di" bpmnElement="Flow_SendRej2_To_EndFail">
        <di:waypoint x="1535" y="600" />
        <di:waypoint x="1592" y="600" />
      </bpmndi:BPMNEdge>

      <!-- DATA ASSOCIATIONS -->
      <bpmndi:BPMNEdge id="DataOutput_SaveToFolder_di" bpmnElement="DataOutput_SaveToFolder">
        <di:waypoint x="400" y="220" />
        <di:waypoint x="400" y="155" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="DataOutput_SaveToExcel_di" bpmnElement="DataOutput_SaveToExcel">
        <di:waypoint x="600" y="300" />
        <di:waypoint x="600" y="385" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="DataInput_ReadFromExcel_di" bpmnElement="DataInput_ReadFromExcel">
        <di:waypoint x="625" y="400" />
        <di:waypoint x="750" y="400" />
        <di:waypoint x="750" y="300" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="DataOutput_UpdateRej1_di" bpmnElement="DataOutput_UpdateRej1">
        <di:waypoint x="1050" y="190" />
        <di:waypoint x="1050" y="410" />
        <di:waypoint x="625" y="410" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="DataOutput_UpdatePassed_di" bpmnElement="DataOutput_UpdatePassed">
        <di:waypoint x="1200" y="450" />
        <di:waypoint x="1200" y="420" />
        <di:waypoint x="625" y="420" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="DataOutput_UpdateFail_di" bpmnElement="DataOutput_UpdateFail">
        <di:waypoint x="1200" y="560" />
        <di:waypoint x="1200" y="430" />
        <di:waypoint x="625" y="430" />
      </bpmndi:BPMNEdge>

    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>

</bpmn:definitions>
'''

with open("docs/diagrams/01_as_is_recruitment_process_bpmn.bpmn", "w", encoding="utf-8") as f:
    f.write(as_is_bpmn_content.strip())

print("AS-IS BPMN 2.0 XML written successfully.")
