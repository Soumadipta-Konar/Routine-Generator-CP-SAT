import pandas as pd

def generate_sample_workbook(output_path="master_schedule_inputs.xlsx"):
    print(f"Generating perfect sample workbook: {output_path}")
    
    # 1. Cohorts Sheet
    cohorts_data = {
        "Cohort_ID": ["CSE_SEM3_A", "CSE_SEM3_B", "ECE_SEM5_A"],
        "Name": ["CSE Semester 3 Section A", "CSE Semester 3 Section B", "ECE Semester 5 Section A"],
        "Semester": [3, 3, 5],
        "Size": [55, 45, 30],
        "Department": ["Computer Science", "Computer Science", "Electronics"]
    }
    
    # 2. Faculty Sheet
    faculty_data = {
        "Faculty_ID": ["FAC_DR_SEN", "FAC_PROF_DAS", "FAC_DR_ROY"],
        "Name": ["Dr. Amit Sen", "Prof. Joy Das", "Dr. Rita Roy"],
        "Contact_Number": ["+919876543210", "+919876543211", "+919876543212"],
        "Email": ["sen@institution.edu", "das@institution.edu", "roy@institution.edu"],
        "Department": ["Computer Science", "Computer Science", "Electronics"],
        "Max_Weekly_Hours": [18, 16, 18]
    }
    
    # 3. Rooms Sheet
    rooms_data = {
        "Room_ID": ["LH_301", "LH_302", "LAB_CS_01"],
        "Name": ["Lecture Hall 301", "Lecture Hall 302", "CS Lab 1"],
        "Capacity": [60, 50, 40],
        "Room_Type": ["Lecture", "Lecture", "Lab"]
    }
    
    # 4. Subjects Sheet
    subjects_data = {
        "Subject_ID": ["SUB_DS", "SUB_DM", "SUB_VLSI"],
        "Code": ["CS-301", "CS-302", "EC-501"],
        "Name": ["Data Structures", "Discrete Math", "VLSI Design"],
        "Subject_Type": ["Lecture", "Lecture", "Lecture"],
        "Is_Heavy_Cognitive": ["Y", "Y", "N"],
        "Periods_Per_Week": [4, 4, 3],
        "Department": ["Computer Science", "Computer Science", "Electronics"],
        "Required_Capabilities": ["Projector", "Projector", "Projector"]
    }
    
    # 5. Curriculum Workload Sheet (Prof-Subject specific smart room preferences included)
    workload_data = {
        "Mapping_ID": ["MAP01", "MAP02", "MAP03"],
        "Cohort_ID": ["CSE_SEM3_A", "CSE_SEM3_B", "ECE_SEM5_A"],
        "Subject_ID": ["SUB_DS", "SUB_DM", "SUB_VLSI"],
        "Faculty_ID": ["FAC_DR_SEN", "FAC_PROF_DAS", "FAC_DR_ROY"],
        "Weekly_Periods": [4, 4, 3],
        "Smart_Class_Requirement": ["MUST_HAVE", "PREFERRED", "NOT_REQUIRED"]
    }

    # Convert to DataFrames
    dfs = {
        "Cohorts": pd.DataFrame(cohorts_data),
        "Faculty": pd.DataFrame(faculty_data),
        "Rooms": pd.DataFrame(rooms_data),
        "Subjects": pd.DataFrame(subjects_data),
        "Curriculum_Workload": pd.DataFrame(workload_data)
    }

    # Write to single Excel workbook with multiple sheets
    with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
        for sheet_name, df in dfs.items():
            df.to_excel(writer, sheet_name=sheet_name, index=False)
            
    print("[SUCCESS] sample workbook 'master_schedule_inputs.xlsx' created successfully.")

if __name__ == "__main__":
    generate_sample_workbook()
