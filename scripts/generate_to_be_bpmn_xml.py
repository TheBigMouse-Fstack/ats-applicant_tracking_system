import xml.etree.ElementTree as ET

to_be_bpmn_content = '''<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_ATS_Recruitment_ToBe"
                  targetNamespace="http://bpmn.io/schema/bpmn"
                  exporter="Antigravity BPMN 2.0 Generator"
                  exporterVersion="2.2.0">

  <bpmn:collaboration id="Collaboration_ToBe_Recruitment">
    <bpmn:participant id="Participant_ToBeProcess" name="RECOVERX ATS TO-BE RECRUITMENT WORKFLOW (AI-ASSISTED)" processRef="Process_ToBe_Recruitment" />
  </bpmn:collaboration>

  <bpmn:process id="Process_ToBe_Recruitment" name="AI-Assisted ATS Recruitment Process" isExecutable="false">
    
    <!-- 4 LANES SET -->
    <bpmn:laneSet id="LaneSet_ToBe">
      <!-- LANE 1: CANDIDATE -->
      <bpmn:lane id="Lane_Candidate" name="1. Candidate (Self-Service)">
        <bpmn:flowNodeRef>Start_CandidateApply</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_SubmitOnlineCV</bpmn:flowNodeRef>
      </bpmn:lane>

      <!-- LANE 2: ATS & AI ENGINE -->
      <bpmn:lane id="Lane_SystemAI" name="2. ATS Platform &amp; AI Engine (Automated Services)">
        <bpmn:flowNodeRef>Task_Deduplication</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_DuplicateCheck</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_MergeApplication</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_AIParsing</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_AIScoring</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CreateKanbanNew</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Event_DelayRejectBuffer</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_SendRejectNotice</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_RejectedArchive</bpmn:flowNodeRef>
      </bpmn:lane>

      <!-- LANE 3: HR RECRUITER -->
      <bpmn:lane id="Lane_RecruiterHR" name="3. Recruiter / HR Talent Acquisition Lead">
        <bpmn:flowNodeRef>Start_HRInternalIntake</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_HRUploadCV</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_HRScreenKanban</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_HRSortingDecision</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_MoveToScreening</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_MoveToRejectScreening</bpmn:flowNodeRef>
      </bpmn:lane>

      <!-- LANE 4: HIRING MANAGER -->
      <bpmn:lane id="Lane_HiringManager" name="4. Hiring Manager / Technical Department Lead">
        <bpmn:flowNodeRef>Task_HMReviewProfile</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_HMApproveInterview</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_ScheduleInterviewAuto</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_ConductInterviewScorecard</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_CheckScorecardRule</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_FinalHiringDecision</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_MoveToHiredOffer</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_MoveToRejectInterview</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_HiredSuccess</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>

    <!-- DATA OBJECTS -->
    <bpmn:dataStoreReference id="DataStore_TalentPool" name="Centralized Talent Pool Database (3 Tier Retention)" />

    <!-- CANDIDATE LANE NODES -->
    <bpmn:startEvent id="Start_CandidateApply" name="Access Public Careers Portal (/jobs)">
      <bpmn:outgoing>Flow_Cand_1</bpmn:outgoing>
    </bpmn:startEvent>

    <bpmn:userTask id="Task_SubmitOnlineCV" name="1A. Complete application form &amp; upload resume (.pdf, .docx)">
      <bpmn:incoming>Flow_Cand_1</bpmn:incoming>
      <bpmn:outgoing>Flow_Cand_To_System</bpmn:outgoing>
    </bpmn:userTask>

    <!-- HR START NODES -->
    <bpmn:startEvent id="Start_HRInternalIntake" name="Receive Employee Referral or Direct Source">
      <bpmn:outgoing>Flow_HR_1</bpmn:outgoing>
    </bpmn:startEvent>

    <bpmn:userTask id="Task_HRUploadCV" name="1B. Ingest resume file into ATS intake modal">
      <bpmn:incoming>Flow_HR_1</bpmn:incoming>
      <bpmn:outgoing>Flow_HR_To_System</bpmn:outgoing>
    </bpmn:userTask>

    <!-- SYSTEM & AI ENGINE NODES -->
    <bpmn:serviceTask id="Task_Deduplication" name="2. Automated deduplication check: Email/Phone in 30 days (BRL-02)">
      <bpmn:incoming>Flow_Cand_To_System</bpmn:incoming>
      <bpmn:incoming>Flow_HR_To_System</bpmn:incoming>
      <bpmn:outgoing>Flow_Dedup_To_Gateway</bpmn:outgoing>
    </bpmn:serviceTask>

    <bpmn:exclusiveGateway id="Gateway_DuplicateCheck" name="Candidate already exists in 30 days?">
      <bpmn:incoming>Flow_Dedup_To_Gateway</bpmn:incoming>
      <bpmn:outgoing>Flow_Dup_Yes</bpmn:outgoing>
      <bpmn:outgoing>Flow_Dup_No</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <bpmn:serviceTask id="Task_MergeApplication" name="Merge application history &amp; raise warning flag">
      <bpmn:incoming>Flow_Dup_Yes</bpmn:incoming>
      <bpmn:outgoing>Flow_Merge_To_AI</bpmn:outgoing>
    </bpmn:serviceTask>

    <bpmn:serviceTask id="Task_AIParsing" name="3. Hybrid AI Parsing: Extract 5 core fields (Name, Phone, Email, Skills, Exp)">
      <bpmn:incoming>Flow_Dup_No</bpmn:incoming>
      <bpmn:incoming>Flow_Merge_To_AI</bpmn:incoming>
      <bpmn:outgoing>Flow_AI_Parse_To_Score</bpmn:outgoing>
    </bpmn:serviceTask>

    <bpmn:serviceTask id="Task_AIScoring" name="4. AI Semantic Matching: Compare JD criteria &amp; generate 3-tier Match Score">
      <bpmn:incoming>Flow_AI_Parse_To_Score</bpmn:incoming>
      <bpmn:outgoing>Flow_AI_Score_To_Kanban</bpmn:outgoing>
    </bpmn:serviceTask>

    <bpmn:serviceTask id="Task_CreateKanbanNew" name="5. Create candidate card in Kanban NEW column (Human-in-the-Loop)">
      <bpmn:incoming>Flow_AI_Score_To_Kanban</bpmn:incoming>
      <bpmn:outgoing>Flow_System_To_HR_Review</bpmn:outgoing>
    </bpmn:serviceTask>

    <!-- HR SCREENING NODES -->
    <bpmn:userTask id="Task_HRScreenKanban" name="6. Review candidate profile &amp; match score on Kanban pipeline">
      <bpmn:incoming>Flow_System_To_HR_Review</bpmn:incoming>
      <bpmn:outgoing>Flow_HR_Review_To_Gate</bpmn:outgoing>
    </bpmn:userTask>

    <bpmn:exclusiveGateway id="Gateway_HRSortingDecision" name="Candidate passes initial screening?">
      <bpmn:incoming>Flow_HR_Review_To_Gate</bpmn:incoming>
      <bpmn:outgoing>Flow_HRSort_Pass</bpmn:outgoing>
      <bpmn:outgoing>Flow_HRSort_Reject</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <bpmn:userTask id="Task_MoveToScreening" name="7. Advance card to SCREENING stage (RBAC boundary)">
      <bpmn:incoming>Flow_HRSort_Pass</bpmn:incoming>
      <bpmn:outgoing>Flow_HR_To_HM_Review</bpmn:outgoing>
    </bpmn:userTask>

    <bpmn:userTask id="Task_MoveToRejectScreening" name="Move card to REJECTED &amp; select mandatory reason (BRL-11)">
      <bpmn:incoming>Flow_HRSort_Reject</bpmn:incoming>
      <bpmn:outgoing>Flow_HR_Reject_To_Buffer</bpmn:outgoing>
    </bpmn:userTask>

    <!-- HIRING MANAGER NODES -->
    <bpmn:userTask id="Task_HMReviewProfile" name="8. Review technical competence &amp; qualification details">
      <bpmn:incoming>Flow_HR_To_HM_Review</bpmn:incoming>
      <bpmn:outgoing>Flow_HM_Review_To_Gate</bpmn:outgoing>
    </bpmn:userTask>

    <bpmn:exclusiveGateway id="Gateway_HMApproveInterview" name="Approve candidate for technical interview?">
      <bpmn:incoming>Flow_HM_Review_To_Gate</bpmn:incoming>
      <bpmn:outgoing>Flow_HM_Interview_Pass</bpmn:outgoing>
      <bpmn:outgoing>Flow_HM_Interview_Reject</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <bpmn:userTask id="Task_ScheduleInterviewAuto" name="9. Advance to INTERVIEW, pick date/time &amp; trigger automated invite workflow">
      <bpmn:incoming>Flow_HM_Interview_Pass</bpmn:incoming>
      <bpmn:outgoing>Flow_Schedule_To_Conduct</bpmn:outgoing>
    </bpmn:userTask>

    <bpmn:userTask id="Task_ConductInterviewScorecard" name="10. Conduct interview &amp; submit 3-criteria weighted Scorecard (BRL-08)">
      <bpmn:incoming>Flow_Schedule_To_Conduct</bpmn:incoming>
      <bpmn:outgoing>Flow_Conduct_To_Gate_Scorecard</bpmn:outgoing>
    </bpmn:userTask>

    <bpmn:exclusiveGateway id="Gateway_CheckScorecardRule" name="At least 1 valid completed Scorecard exists? (BRL-06 Gate)">
      <bpmn:incoming>Flow_Conduct_To_Gate_Scorecard</bpmn:incoming>
      <bpmn:outgoing>Flow_Scorecard_Valid</bpmn:outgoing>
      <bpmn:outgoing>Flow_Scorecard_Missing</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <bpmn:exclusiveGateway id="Gateway_FinalHiringDecision" name="Hiring consensus reached?">
      <bpmn:incoming>Flow_Scorecard_Valid</bpmn:incoming>
      <bpmn:outgoing>Flow_Final_Hired</bpmn:outgoing>
      <bpmn:outgoing>Flow_Final_Reject</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <bpmn:userTask id="Task_MoveToHiredOffer" name="11. Advance card to HIRED &amp; generate official Job Offer">
      <bpmn:incoming>Flow_Final_Hired</bpmn:incoming>
      <bpmn:outgoing>Flow_Hired_To_End</bpmn:outgoing>
    </bpmn:userTask>

    <bpmn:endEvent id="End_HiredSuccess" name="Recruitment Successful: Candidate Hired &amp; Handed to Onboarding">
      <bpmn:incoming>Flow_Hired_To_End</bpmn:incoming>
    </bpmn:endEvent>

    <bpmn:userTask id="Task_MoveToRejectInterview" name="Move card to REJECTED &amp; record interview evaluation reason (BRL-11)">
      <bpmn:incoming>Flow_HM_Interview_Reject</bpmn:incoming>
      <bpmn:incoming>Flow_Final_Reject</bpmn:incoming>
      <bpmn:incoming>Flow_Scorecard_Missing</bpmn:incoming>
      <bpmn:outgoing>Flow_HM_Reject_To_Buffer</bpmn:outgoing>
    </bpmn:userTask>

    <!-- REJECTION DELAY BUFFER & TALENT POOL IN SYSTEM LANE -->
    <bpmn:intermediateCatchEvent id="Event_DelayRejectBuffer" name="12-Hour Delay Buffer (Psychological grace period BRL-05)">
      <bpmn:incoming>Flow_HR_Reject_To_Buffer</bpmn:incoming>
      <bpmn:incoming>Flow_HM_Reject_To_Buffer</bpmn:incoming>
      <bpmn:outgoing>Flow_Buffer_To_SendNotice</bpmn:outgoing>
      <bpmn:timerEventDefinition id="TimerEventDefinition_Delay12h" />
    </bpmn:intermediateCatchEvent>

    <bpmn:sendTask id="Task_SendRejectNotice" name="12. Dispatch automated polite regret email &amp; index into Talent Pool">
      <bpmn:incoming>Flow_Buffer_To_SendNotice</bpmn:incoming>
      <bpmn:outgoing>Flow_Notice_To_EndArchive</bpmn:outgoing>
      <bpmn:dataOutputAssociation id="DataOutput_TalentPoolArchive">
        <bpmn:targetRef>DataStore_TalentPool</bpmn:targetRef>
      </bpmn:dataOutputAssociation>
    </bpmn:sendTask>

    <bpmn:endEvent id="End_RejectedArchive" name="Candidate Profile Archived in Talent Pool (180-Day Lifecycle)">
      <bpmn:incoming>Flow_Notice_To_EndArchive</bpmn:incoming>
    </bpmn:endEvent>

    <!-- SEQUENCE FLOWS -->
    <bpmn:sequenceFlow id="Flow_Cand_1" sourceRef="Start_CandidateApply" targetRef="Task_SubmitOnlineCV" />
    <bpmn:sequenceFlow id="Flow_Cand_To_System" sourceRef="Task_SubmitOnlineCV" targetRef="Task_Deduplication" />
    <bpmn:sequenceFlow id="Flow_HR_1" sourceRef="Start_HRInternalIntake" targetRef="Task_HRUploadCV" />
    <bpmn:sequenceFlow id="Flow_HR_To_System" sourceRef="Task_HRUploadCV" targetRef="Task_Deduplication" />
    <bpmn:sequenceFlow id="Flow_Dedup_To_Gateway" sourceRef="Task_Deduplication" targetRef="Gateway_DuplicateCheck" />
    <bpmn:sequenceFlow id="Flow_Dup_Yes" name="Duplicate Found" sourceRef="Gateway_DuplicateCheck" targetRef="Task_MergeApplication" />
    <bpmn:sequenceFlow id="Flow_Dup_No" name="Unique New Profile" sourceRef="Gateway_DuplicateCheck" targetRef="Task_AIParsing" />
    <bpmn:sequenceFlow id="Flow_Merge_To_AI" sourceRef="Task_MergeApplication" targetRef="Task_AIParsing" />
    <bpmn:sequenceFlow id="Flow_AI_Parse_To_Score" sourceRef="Task_AIParsing" targetRef="Task_AIScoring" />
    <bpmn:sequenceFlow id="Flow_AI_Score_To_Kanban" sourceRef="Task_AIScoring" targetRef="Task_CreateKanbanNew" />
    <bpmn:sequenceFlow id="Flow_System_To_HR_Review" sourceRef="Task_CreateKanbanNew" targetRef="Task_HRScreenKanban" />
    <bpmn:sequenceFlow id="Flow_HR_Review_To_Gate" sourceRef="Task_HRScreenKanban" targetRef="Gateway_HRSortingDecision" />
    <bpmn:sequenceFlow id="Flow_HRSort_Pass" name="Qualified" sourceRef="Gateway_HRSortingDecision" targetRef="Task_MoveToScreening" />
    <bpmn:sequenceFlow id="Flow_HRSort_Reject" name="Not Suitable" sourceRef="Gateway_HRSortingDecision" targetRef="Task_MoveToRejectScreening" />
    <bpmn:sequenceFlow id="Flow_HR_Reject_To_Buffer" sourceRef="Task_MoveToRejectScreening" targetRef="Event_DelayRejectBuffer" />
    <bpmn:sequenceFlow id="Flow_HR_To_HM_Review" sourceRef="Task_MoveToScreening" targetRef="Task_HMReviewProfile" />
    <bpmn:sequenceFlow id="Flow_HM_Review_To_Gate" sourceRef="Task_HMReviewProfile" targetRef="Gateway_HMApproveInterview" />
    <bpmn:sequenceFlow id="Flow_HM_Interview_Pass" name="Approved for Interview" sourceRef="Gateway_HMApproveInterview" targetRef="Task_ScheduleInterviewAuto" />
    <bpmn:sequenceFlow id="Flow_HM_Interview_Reject" name="Rejected" sourceRef="Gateway_HMApproveInterview" targetRef="Task_MoveToRejectInterview" />
    <bpmn:sequenceFlow id="Flow_Schedule_To_Conduct" sourceRef="Task_ScheduleInterviewAuto" targetRef="Task_ConductInterviewScorecard" />
    <bpmn:sequenceFlow id="Flow_Conduct_To_Gate_Scorecard" sourceRef="Task_ConductInterviewScorecard" targetRef="Gateway_CheckScorecardRule" />
    <bpmn:sequenceFlow id="Flow_Scorecard_Valid" name="Scorecard Rule Passed" sourceRef="Gateway_CheckScorecardRule" targetRef="Gateway_FinalHiringDecision" />
    <bpmn:sequenceFlow id="Flow_Scorecard_Missing" name="Blocked: Missing Scorecard" sourceRef="Gateway_CheckScorecardRule" targetRef="Task_MoveToRejectInterview" />
    <bpmn:sequenceFlow id="Flow_Final_Hired" name="Selected for Hire" sourceRef="Gateway_FinalHiringDecision" targetRef="Task_MoveToHiredOffer" />
    <bpmn:sequenceFlow id="Flow_Final_Reject" name="Declined" sourceRef="Gateway_FinalHiringDecision" targetRef="Task_MoveToRejectInterview" />
    <bpmn:sequenceFlow id="Flow_Hired_To_End" sourceRef="Task_MoveToHiredOffer" targetRef="End_HiredSuccess" />
    <bpmn:sequenceFlow id="Flow_HM_Reject_To_Buffer" sourceRef="Task_MoveToRejectInterview" targetRef="Event_DelayRejectBuffer" />
    <bpmn:sequenceFlow id="Flow_Buffer_To_SendNotice" sourceRef="Event_DelayRejectBuffer" targetRef="Task_SendRejectNotice" />
    <bpmn:sequenceFlow id="Flow_Notice_To_EndArchive" sourceRef="Task_SendRejectNotice" targetRef="End_RejectedArchive" />

  </bpmn:process>

  <!-- GRAPHICAL COORDINATES (DI) -->
  <bpmndi:BPMNDiagram id="BPMNDiagram_ATS_ToBe">
    <bpmndi:BPMNPlane id="BPMNPlane_ATS_ToBe" bpmnElement="Collaboration_ToBe_Recruitment">
      
      <!-- PARTICIPANT POOL -->
      <bpmndi:BPMNShape id="Participant_ToBeProcess_di" bpmnElement="Participant_ToBeProcess" isHorizontal="true">
        <dc:Bounds x="160" y="80" width="1920" height="960" />
      </bpmndi:BPMNShape>

      <!-- 4 LANES -->
      <bpmndi:BPMNShape id="Lane_Candidate_di" bpmnElement="Lane_Candidate" isHorizontal="true">
        <dc:Bounds x="190" y="80" width="1890" height="180" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Lane_SystemAI_di" bpmnElement="Lane_SystemAI" isHorizontal="true">
        <dc:Bounds x="190" y="260" width="1890" height="260" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Lane_RecruiterHR_di" bpmnElement="Lane_RecruiterHR" isHorizontal="true">
        <dc:Bounds x="190" y="520" width="1890" height="240" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Lane_HiringManager_di" bpmnElement="Lane_HiringManager" isHorizontal="true">
        <dc:Bounds x="190" y="760" width="1890" height="280" />
      </bpmndi:BPMNShape>

      <!-- DATA STORES -->
      <bpmndi:BPMNShape id="DataStore_TalentPool_di" bpmnElement="DataStore_TalentPool">
        <dc:Bounds x="1875" y="445" width="50" height="50" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="1855" y="502" width="90" height="40" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <!-- CANDIDATE SHAPES -->
      <bpmndi:BPMNShape id="Start_CandidateApply_di" bpmnElement="Start_CandidateApply">
        <dc:Bounds x="250" y="142" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="226" y="185" width="85" height="40" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_SubmitOnlineCV_di" bpmnElement="Task_SubmitOnlineCV">
        <dc:Bounds x="350" y="120" width="160" height="80" />
      </bpmndi:BPMNShape>

      <!-- HR START SHAPES -->
      <bpmndi:BPMNShape id="Start_HRInternalIntake_di" bpmnElement="Start_HRInternalIntake">
        <dc:Bounds x="250" y="592" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="228" y="635" width="81" height="40" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_HRUploadCV_di" bpmnElement="Task_HRUploadCV">
        <dc:Bounds x="350" y="570" width="160" height="80" />
      </bpmndi:BPMNShape>

      <!-- SYSTEM & AI SHAPES -->
      <bpmndi:BPMNShape id="Task_Deduplication_di" bpmnElement="Task_Deduplication">
        <dc:Bounds x="560" y="350" width="160" height="80" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Gateway_DuplicateCheck_di" bpmnElement="Gateway_DuplicateCheck" isMarkerVisible="true">
        <dc:Bounds x="765" y="365" width="50" height="50" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="748" y="341" width="85" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_MergeApplication_di" bpmnElement="Task_MergeApplication">
        <dc:Bounds x="860" y="280" width="140" height="70" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_AIParsing_di" bpmnElement="Task_AIParsing">
        <dc:Bounds x="860" y="390" width="150" height="80" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_AIScoring_di" bpmnElement="Task_AIScoring">
        <dc:Bounds x="1050" y="390" width="150" height="80" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_CreateKanbanNew_di" bpmnElement="Task_CreateKanbanNew">
        <dc:Bounds x="1240" y="390" width="150" height="80" />
      </bpmndi:BPMNShape>

      <!-- HR SCREENING SHAPES -->
      <bpmndi:BPMNShape id="Task_HRScreenKanban_di" bpmnElement="Task_HRScreenKanban">
        <dc:Bounds x="1240" y="570" width="150" height="80" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Gateway_HRSortingDecision_di" bpmnElement="Gateway_HRSortingDecision" isMarkerVisible="true">
        <dc:Bounds x="1445" y="585" width="50" height="50" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="1430" y="555" width="80" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_MoveToScreening_di" bpmnElement="Task_MoveToScreening">
        <dc:Bounds x="1550" y="570" width="150" height="80" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_MoveToRejectScreening_di" bpmnElement="Task_MoveToRejectScreening">
        <dc:Bounds x="1400" y="660" width="140" height="70" />
      </bpmndi:BPMNShape>

      <!-- HIRING MANAGER SHAPES -->
      <bpmndi:BPMNShape id="Task_HMReviewProfile_di" bpmnElement="Task_HMReviewProfile">
        <dc:Bounds x="1550" y="800" width="150" height="80" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Gateway_HMApproveInterview_di" bpmnElement="Gateway_HMApproveInterview" isMarkerVisible="true">
        <dc:Bounds x="1595" y="915" width="50" height="50" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="1582" y="972" width="76" height="40" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_ScheduleInterviewAuto_di" bpmnElement="Task_ScheduleInterviewAuto">
        <dc:Bounds x="1350" y="800" width="160" height="80" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_ConductInterviewScorecard_di" bpmnElement="Task_ConductInterviewScorecard">
        <dc:Bounds x="1140" y="800" width="170" height="80" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Gateway_CheckScorecardRule_di" bpmnElement="Gateway_CheckScorecardRule" isMarkerVisible="true">
        <dc:Bounds x="1035" y="815" width="50" height="50" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="1018" y="872" width="84" height="40" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Gateway_FinalHiringDecision_di" bpmnElement="Gateway_FinalHiringDecision" isMarkerVisible="true">
        <dc:Bounds x="925" y="815" width="50" height="50" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="911" y="872" width="78" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_MoveToHiredOffer_di" bpmnElement="Task_MoveToHiredOffer">
        <dc:Bounds x="730" y="800" width="150" height="80" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="End_HiredSuccess_di" bpmnElement="End_HiredSuccess">
        <dc:Bounds x="642" y="822" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="618" y="865" width="85" height="40" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_MoveToRejectInterview_di" bpmnElement="Task_MoveToRejectInterview">
        <dc:Bounds x="1000" y="930" width="150" height="70" />
      </bpmndi:BPMNShape>

      <!-- SYSTEM REJECTION BUFFER & TALENT POOL SHAPES -->
      <bpmndi:BPMNShape id="Event_DelayRejectBuffer_di" bpmnElement="Event_DelayRejectBuffer">
        <dc:Bounds x="1602" y="322" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="1578" y="280" width="84" height="40" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_SendRejectNotice_di" bpmnElement="Task_SendRejectNotice">
        <dc:Bounds x="1690" y="300" width="160" height="80" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="End_RejectedArchive_di" bpmnElement="End_RejectedArchive">
        <dc:Bounds x="1912" y="322" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="1888" y="365" width="85" height="53" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <!-- EDGES -->
      <bpmndi:BPMNEdge id="Flow_Cand_1_di" bpmnElement="Flow_Cand_1">
        <di:waypoint x="286" y="160" />
        <di:waypoint x="350" y="160" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_Cand_To_System_di" bpmnElement="Flow_Cand_To_System">
        <di:waypoint x="510" y="160" />
        <di:waypoint x="535" y="160" />
        <di:waypoint x="535" y="370" />
        <di:waypoint x="560" y="370" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_HR_1_di" bpmnElement="Flow_HR_1">
        <di:waypoint x="286" y="610" />
        <di:waypoint x="350" y="610" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_HR_To_System_di" bpmnElement="Flow_HR_To_System">
        <di:waypoint x="510" y="610" />
        <di:waypoint x="535" y="610" />
        <di:waypoint x="535" y="410" />
        <di:waypoint x="560" y="410" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_Dedup_To_Gateway_di" bpmnElement="Flow_Dedup_To_Gateway">
        <di:waypoint x="720" y="390" />
        <di:waypoint x="765" y="390" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_Dup_Yes_di" bpmnElement="Flow_Dup_Yes">
        <di:waypoint x="790" y="365" />
        <di:waypoint x="790" y="315" />
        <di:waypoint x="860" y="315" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="798" y="293" width="78" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_Dup_No_di" bpmnElement="Flow_Dup_No">
        <di:waypoint x="790" y="415" />
        <di:waypoint x="790" y="430" />
        <di:waypoint x="860" y="430" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="798" y="433" width="53" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_Merge_To_AI_di" bpmnElement="Flow_Merge_To_AI">
        <di:waypoint x="930" y="350" />
        <di:waypoint x="930" y="390" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_AI_Parse_To_Score_di" bpmnElement="Flow_AI_Parse_To_Score">
        <di:waypoint x="1010" y="430" />
        <di:waypoint x="1050" y="430" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_AI_Score_To_Kanban_di" bpmnElement="Flow_AI_Score_To_Kanban">
        <di:waypoint x="1200" y="430" />
        <di:waypoint x="1240" y="430" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_System_To_HR_Review_di" bpmnElement="Flow_System_To_HR_Review">
        <di:waypoint x="1315" y="470" />
        <di:waypoint x="1315" y="570" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_HR_Review_To_Gate_di" bpmnElement="Flow_HR_Review_To_Gate">
        <di:waypoint x="1390" y="610" />
        <di:waypoint x="1445" y="610" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_HRSort_Pass_di" bpmnElement="Flow_HRSort_Pass">
        <di:waypoint x="1495" y="610" />
        <di:waypoint x="1550" y="610" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="1498" y="592" width="46" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_HRSort_Reject_di" bpmnElement="Flow_HRSort_Reject">
        <di:waypoint x="1470" y="635" />
        <di:waypoint x="1470" y="660" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="1474" y="638" width="61" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_HR_Reject_To_Buffer_di" bpmnElement="Flow_HR_Reject_To_Buffer">
        <di:waypoint x="1540" y="695" />
        <di:waypoint x="1620" y="695" />
        <di:waypoint x="1620" y="358" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_HR_To_HM_Review_di" bpmnElement="Flow_HR_To_HM_Review">
        <di:waypoint x="1625" y="650" />
        <di:waypoint x="1625" y="800" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_HM_Review_To_Gate_di" bpmnElement="Flow_HM_Review_To_Gate">
        <di:waypoint x="1620" y="880" />
        <di:waypoint x="1620" y="915" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_HM_Interview_Pass_di" bpmnElement="Flow_HM_Interview_Pass">
        <di:waypoint x="1595" y="940" />
        <di:waypoint x="1430" y="940" />
        <di:waypoint x="1430" y="880" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="1472" y="922" width="81" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_HM_Interview_Reject_di" bpmnElement="Flow_HM_Interview_Reject">
        <di:waypoint x="1645" y="940" />
        <di:waypoint x="1650" y="965" />
        <di:waypoint x="1150" y="965" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="1646" y="948" width="45" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_Schedule_To_Conduct_di" bpmnElement="Flow_Schedule_To_Conduct">
        <di:waypoint x="1350" y="840" />
        <di:waypoint x="1310" y="840" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_Conduct_To_Gate_Scorecard_di" bpmnElement="Flow_Conduct_To_Gate_Scorecard">
        <di:waypoint x="1140" y="840" />
        <di:waypoint x="1085" y="840" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_Scorecard_Valid_di" bpmnElement="Flow_Scorecard_Valid">
        <di:waypoint x="1035" y="840" />
        <di:waypoint x="975" y="840" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="978" y="813" width="76" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_Scorecard_Missing_di" bpmnElement="Flow_Scorecard_Missing">
        <di:waypoint x="1060" y="865" />
        <di:waypoint x="1060" y="930" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="1065" y="885" width="83" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_Final_Hired_di" bpmnElement="Flow_Final_Hired">
        <di:waypoint x="925" y="840" />
        <di:waypoint x="880" y="840" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="874" y="822" width="60" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_Final_Reject_di" bpmnElement="Flow_Final_Reject">
        <di:waypoint x="950" y="865" />
        <di:waypoint x="950" y="950" />
        <di:waypoint x="1000" y="950" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="954" y="895" width="45" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_Hired_To_End_di" bpmnElement="Flow_Hired_To_End">
        <di:waypoint x="730" y="840" />
        <di:waypoint x="678" y="840" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_HM_Reject_To_Buffer_di" bpmnElement="Flow_HM_Reject_To_Buffer">
        <di:waypoint x="1150" y="965" />
        <di:waypoint x="1750" y="965" />
        <di:waypoint x="1750" y="410" />
        <di:waypoint x="1635" y="345" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_Buffer_To_SendNotice_di" bpmnElement="Flow_Buffer_To_SendNotice">
        <di:waypoint x="1638" y="340" />
        <di:waypoint x="1690" y="340" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_Notice_To_EndArchive_di" bpmnElement="Flow_Notice_To_EndArchive">
        <di:waypoint x="1850" y="340" />
        <di:waypoint x="1912" y="340" />
      </bpmndi:BPMNEdge>

      <!-- DATA ASSOCIATION -->
      <bpmndi:BPMNEdge id="DataOutput_TalentPoolArchive_di" bpmnElement="DataOutput_TalentPoolArchive">
        <di:waypoint x="1770" y="380" />
        <di:waypoint x="1770" y="470" />
        <di:waypoint x="1875" y="470" />
      </bpmndi:BPMNEdge>

    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>

</bpmn:definitions>
'''

with open("docs/diagrams/02_to_be_recruitment_process_bpmn.bpmn", "w", encoding="utf-8") as f:
    f.write(to_be_bpmn_content.strip())

print("TO-BE BPMN 2.0 XML written successfully.")
