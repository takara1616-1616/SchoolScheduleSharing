import { supabase } from "./supabaseClient";

// Color mappings for subjects
const SUBJECT_COLORS: { [key: string]: string } = {
  "国語": "#FF9F9F",
  "数学": "#7B9FE8",
  "英語": "#FFD6A5",
  "理科": "#A8E8D8",
  "社会": "#B8A8E8",
  "保健体育": "#FFA8C8",
  "芸術": "#FFB8E8",
  "家庭": "#FFE8A8",
  "情報": "#C8D8FF",
  "その他": "#D8D8D8",
};

const CATEGORY_COLORS: { [key: string]: string } = {
  "行事": "#FFA8C8",
  "連絡事項": "#A8D8E8",
  "持ち物": "#FFE8A8",
  "その他": "#D8D8D8",
};

// Helper function to get authenticated user's ID from users table
async function getCurrentUserIdFromDatabase(): Promise<number | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return null;

    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user ID:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Error in getCurrentUserIdFromDatabase:', error);
    return null;
  }
}

// Fetch assignments from announcements table (type='assignment')
export async function fetchAssignments() {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select(`
        id,
        title,
        description,
        due_date,
        submission_method,
        subjects ( name ),
        subsubjects ( name )
      `)
      .eq('type', 'assignment')
      .order('due_date', { ascending: true });

    if (error) throw error;

    // Transform database format to component format
    return (data || []).map((item: any) => ({
      id: item.id.toString(),
      subject: item.subjects?.name || "その他",
      subjectColor: SUBJECT_COLORS[item.subjects?.name || "その他"] || "#D8D8D8",
      course: item.subsubjects?.name || "",
      content: item.description || item.title || "",
      submitTo: item.submission_method || "先生",
      deadline: item.due_date ? formatDateJapanese(new Date(item.due_date)) : "",
      isChecked: false, // Default to unchecked for teacher view
    }));
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return [];
  }
}

// Fetch test ranges from announcements table (type='test')
export async function fetchTestRanges() {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select(`
        id,
        title,
        description,
        due_date,
        subjects ( name ),
        subsubjects ( name )
      `)
      .eq('type', 'test')
      .order('due_date', { ascending: true });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id.toString(),
      subject: item.subjects?.name || "その他",
      subjectColor: SUBJECT_COLORS[item.subjects?.name || "その他"] || "#D8D8D8",
      course: item.subsubjects?.name || "",
      content: item.description || item.title || "",
      testDate: item.due_date ? formatDateJapanese(new Date(item.due_date)) : "",
    }));
  } catch (error) {
    console.error('Error fetching test ranges:', error);
    return [];
  }
}

// Fetch other notices from announcements table (type='other')
export async function fetchOtherNotices() {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select(`
        id,
        title,
        description,
        due_date
      `)
      .eq('type', 'general_notice')
      .order('due_date', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id.toString(),
      title: item.title || "",
      content: item.description || "",
      category: item.category || "その他",
      categoryColor: CATEGORY_COLORS[item.category || "その他"] || "#D8D8D8",
      date: item.due_date ? formatDateJapanese(new Date(item.due_date)) : "",
    }));
  } catch (error) {
    console.error('Error fetching other notices:', error);
    return [];
  }
}

// Fetch teachers from users table (role='teacher')
export async function fetchTeachers() {
  try {
    // Step 1 & 2: Find teacher role and user IDs (already robust)
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'teacher');

    if (roleError || !roleData || roleData.length === 0) {
      console.error("Could not find 'teacher' role in database. Returning empty teacher list.", roleError);
      return [];
    }
    const teacherRoleId = roleData[0].id;

    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role_id', teacherRoleId);

    if (userRolesError) {
      console.error("Error fetching from user_roles:", userRolesError);
      throw userRolesError;
    }
    if (!userRoles || userRoles.length === 0) {
      return [];
    }
    const teacherIds = userRoles.map((ur: any) => ur.user_id);

    // Step 3: Fetch teacher user details
    const { data: teachers, error: teachersError } = await supabase
      .from('users')
      .select('id, name, email')
      .in('id', teacherIds)
      .order('name', { ascending: true });

    if (teachersError) {
      console.error("Error fetching users:", teachersError);
      throw teachersError;
    }
    if (!teachers) return [];

    // Step 4: Fetch all relationships and names in batches
    const { data: subjectLinks, error: subjectLinksError } = await supabase
      .from('subject_teachers')
      .select('teacher_id, subject_id')
      .in('teacher_id', teacherIds);
    if (subjectLinksError) throw subjectLinksError;

    const { data: subsubjectLinks, error: subsubjectLinksError } = await supabase
      .from('subsubject_teachers')
      .select('teacher_id, subsubject_id')
      .in('teacher_id', teacherIds);
    if (subsubjectLinksError) throw subsubjectLinksError;

    const { data: allSubjects, error: allSubjectsError } = await supabase.from('subjects').select('id, name');
    if (allSubjectsError) throw allSubjectsError;
    const subjectMap = new Map((allSubjects || []).map((s: any) => [s.id, s.name]));

    const { data: allSubsubjects, error: allSubsubjectsError } = await supabase.from('subsubjects').select('id, name');
    if (allSubsubjectsError) throw allSubsubjectsError;
    const subsubjectMap = new Map((allSubsubjects || []).map((s: any) => [s.id, s.name]));

    // Step 5: Map over teachers and attach their subjects and courses
    return teachers.map((teacher) => {
      const subjectIds = (subjectLinks || []).filter(l => l.teacher_id === teacher.id).map(l => l.subject_id);
      const subjectNames = subjectIds.map(id => subjectMap.get(id)).filter(Boolean) as string[];

      const subsubjectIds = (subsubjectLinks || []).filter(l => l.teacher_id === teacher.id).map(l => l.subsubject_id);
      const courseNames = subsubjectIds.map(id => subsubjectMap.get(id)).filter(Boolean) as string[];

      return {
        id: teacher.id.toString(),
        name: teacher.name || teacher.email || "名前なし",
        email: teacher.email || "",
        subjects: subjectNames,
        courses: courseNames,
      };
    });

  } catch (error) {
    console.error('Error in fetchTeachers function:', error);
    return [];
  }
}

export async function fetchStudents() {
  try {
    // First, identify all teacher IDs to exclude them from the student list.
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'teacher');

    let teacherIds: number[] = [];
    if (roleError || !roleData || roleData.length === 0) {
      console.error("Could not find 'teacher' role for student exclusion, proceeding without exclusion.", roleError);
    } else {
      const teacherRoleId = roleData[0].id;
      const { data: userRoles, error: userRolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role_id', teacherRoleId);

      if (userRolesError) {
        console.error('Error fetching teacher roles for student exclusion:', userRolesError);
      } else if (userRoles) {
        teacherIds = userRoles.map((ur: any) => ur.user_id);
      }
    }

    // Fetch all users that are NOT in the teacherIds list.
    let query = supabase.from('users').select('id, name, email');
    if (teacherIds.length > 0) {
      query = query.not('id', 'in', `(${teacherIds.join(',')})`);
    }
    const { data, error } = await query.order('name', { ascending: true });

    if (error) throw error;

    return (data || []).map((student: any) => ({
      id: student.id.toString(),
      name: student.name || student.email || "名前なし",
      email: student.email || "",
      class: "", // Will need to add class field to database
    }));
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
}

// Fetch subjects with subsubjects
export async function fetchSubjectsWithCourses() {
  try {
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('id, name')
      .order('id', { ascending: true });

    if (subjectsError) throw subjectsError;

    const { data: subsubjects, error: subsubjectsError } = await supabase
      .from('subsubjects')
      .select('id, name, subject_id')
      .order('subject_id', { ascending: true });

    if (subsubjectsError) throw subsubjectsError;

    // Transform to component format, maintaining subject_id order
    const result: any[] = [];
    let idCounter = 1;

    // Sort subjects by ID first, then add their subsubjects
    const sortedSubjects = (subjects || []).sort((a: any, b: any) => a.id - b.id);

    sortedSubjects.forEach((subject: any) => {
      const subjectSubsubjects = (subsubjects || [])
        .filter((sub: any) => sub.subject_id === subject.id)
        .sort((a: any, b: any) => a.id - b.id);

      subjectSubsubjects.forEach((subsubject: any) => {
        result.push({
          id: `${subject.id}-${subsubject.id}`, // Stable composite ID
          category: subject.name || "", // Null check
          categoryColor: SUBJECT_COLORS[subject.name || ""] || "#D8D8D8",
          courseName: subsubject.name || "", // Null check
          subjectId: subject.id,
          subsubjectId: subsubject.id,
        });
      });
    });

    return result;
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return [];
  }
}

// Fetch all subjects (for multi-select dropdown in AddTeacherModal)
export async function fetchSubjects() {
  try {
    const { data: subjects, error } = await supabase
      .from('subjects')
      .select('id, name')
      .order('id', { ascending: true });

    if (error) throw error;

    return (subjects || []).map((subject: any) => ({
      id: subject.id.toString(),
      name: subject.name,
      color: SUBJECT_COLORS[subject.name] || "#D8D8D8",
    }));
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return [];
  }
}

// Create assignment
export async function createAssignment(assignment: {
  subject: string;
  course: string;
  content: string;
  submitTo: string;
  deadline: string;
}) {
  try {
    const userId = await getCurrentUserIdFromDatabase();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Find subject ID by name
    const { data: subjectData } = await supabase
      .from('subjects')
      .select('id')
      .eq('name', assignment.subject)
      .maybeSingle();

    // Find subsubject ID by name
    const { data: subsubjectData } = await supabase
      .from('subsubjects')
      .select('id')
      .eq('name', assignment.course)
      .maybeSingle();

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        subject_id: subjectData?.id || null,
        subsubject_id: subsubjectData?.id || null,
        created_by: userId,
        title: assignment.content.substring(0, 100),
        description: assignment.content,
        type: 'assignment',
        due_date: parseDateJapanese(assignment.deadline),
        submission_method: assignment.submitTo,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating assignment:', error);
    throw error;
  }
}

// Create test range
export async function createTestRange(testRange: {
  subject: string;
  course: string;
  content: string;
  testDate: string;
}) {
  try {
    const userId = await getCurrentUserIdFromDatabase();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data: subjectData } = await supabase
      .from('subjects')
      .select('id')
      .eq('name', testRange.subject)
      .maybeSingle();

    const { data: subsubjectData } = await supabase
      .from('subsubjects')
      .select('id')
      .eq('name', testRange.course)
      .maybeSingle();

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        subject_id: subjectData?.id || null,
        subsubject_id: subsubjectData?.id || null,
        created_by: userId,
        title: testRange.content.substring(0, 100),
        description: testRange.content,
        type: 'test',
        due_date: parseDateJapanese(testRange.testDate),
        submission_method: '', // Required field even for tests
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating test range:', error);
    throw error;
  }
}

// Create other notice
export async function createOtherNotice(notice: {
  title: string;
  content: string;
  category: string;
  date: string;
}) {
  try {
    const userId = await getCurrentUserIdFromDatabase();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        created_by: userId,
        title: notice.title,
        description: notice.content,
        type: 'general_notice',
        due_date: parseDateJapanese(notice.date),
        submission_method: '', // Required field
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating other notice:', error);
    throw error;
  }
}

// Delete assignments
export async function deleteAssignments(ids: string[]) {
  try {
    const numericIds = ids.map(id => parseInt(id));
    const { error } = await supabase
      .from('announcements')
      .delete()
      .in('id', numericIds);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting assignments:', error);
    throw error;
  }
}

// Delete test ranges
export async function deleteTestRanges(ids: string[]) {
  try {
    const numericIds = ids.map(id => parseInt(id));
    const { error } = await supabase
      .from('announcements')
      .delete()
      .in('id', numericIds);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting test ranges:', error);
    throw error;
  }
}

// Delete other notices
export async function deleteOtherNotices(ids: string[]) {
  try {
    const numericIds = ids.map(id => parseInt(id));
    const { error } = await supabase
      .from('announcements')
      .delete()
      .in('id', numericIds);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting other notices:', error);
    throw error;
  }
}

// Update assignment
export async function updateAssignment(id: string, updates: any) {
  try {
    const { error } = await supabase
      .from('announcements')
      .update({
        description: updates.content,
        submission_method: updates.submitTo,
        due_date: updates.deadline ? parseDateJapanese(updates.deadline) : null,
      })
      .eq('id', parseInt(id));

    if (error) throw error;
  } catch (error) {
    console.error('Error updating assignment:', error);
    throw error;
  }
}

// Update test range
export async function updateTestRange(id: string, updates: any) {
  try {
    const { error } = await supabase
      .from('announcements')
      .update({
        description: updates.content,
        due_date: updates.testDate ? parseDateJapanese(updates.testDate) : null,
      })
      .eq('id', parseInt(id));

    if (error) throw error;
  } catch (error) {
    console.error('Error updating test range:', error);
    throw error;
  }
}

// Update other notice
export async function updateOtherNotice(id: string, updates: any) {
  try {
    const { error } = await supabase
      .from('announcements')
      .update({
        title: updates.title,
        description: updates.content,
        due_date: updates.date ? parseDateJapanese(updates.date) : null,
      })
      .eq('id', parseInt(id));

    if (error) throw error;
  } catch (error) {
    console.error('Error updating other notice:', error);
    throw error;
  }
}

// Helper function to format date in Japanese style
function formatDateJapanese(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const weekday = weekdays[date.getDay()];
  return `${month}月${day}日(${weekday})`;
}

// Helper function to parse Japanese date string (rough approximation)
function parseDateJapanese(dateStr: string): string | null {
  try {
    // Try to extract month and day from format like "6月8日(火)"
    const match = dateStr.match(/(\d+)月(\d+)日/);
    if (match) {
      const month = parseInt(match[1]);
      const day = parseInt(match[2]);
      const currentYear = new Date().getFullYear();
      const date = new Date(currentYear, month - 1, day);
      return date.toISOString();
    }
    return null;
  } catch {
    return null;
  }
}

// ============ Subjects/Subsubjects CRUD Functions ============

// Create subsubject (科目)
export async function createSubsubject(data: { category: string; courseName: string }) {
  try {
    // Find or create subject
    let subjectId: number | null = null;
    const { data: existingSubject } = await supabase
      .from('subjects')
      .select('id')
      .eq('name', data.category)
      .maybeSingle();

    if (existingSubject) {
      subjectId = existingSubject.id;
    } else {
      // Create new subject
      const { data: newSubject, error: subjectError } = await supabase
        .from('subjects')
        .insert({ name: data.category })
        .select()
        .single();

      if (subjectError) throw subjectError;
      subjectId = newSubject.id;
    }

    // Create subsubject
    const { data: newSubsubject, error } = await supabase
      .from('subsubjects')
      .insert({
        subject_id: subjectId,
        name: data.courseName,
      })
      .select()
      .single();

    if (error) throw error;
    return newSubsubject;
  } catch (error) {
    console.error('Error creating subsubject:', error);
    throw error;
  }
}

// Update subsubject
export async function updateSubsubject(subsubjectId: number, updates: { category: string; courseName: string }) {
  try {
    // Find or create subject
    let subjectId: number | null = null;
    const { data: existingSubject } = await supabase
      .from('subjects')
      .select('id')
      .eq('name', updates.category)
      .maybeSingle();

    if (existingSubject) {
      subjectId = existingSubject.id;
    } else {
      const { data: newSubject, error: subjectError } = await supabase
        .from('subjects')
        .insert({ name: updates.category })
        .select()
        .single();

      if (subjectError) throw subjectError;
      subjectId = newSubject.id;
    }

    // Update subsubject
    const { error } = await supabase
      .from('subsubjects')
      .update({
        subject_id: subjectId,
        name: updates.courseName,
      })
      .eq('id', subsubjectId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating subsubject:', error);
    throw error;
  }
}

// Delete subsubjects
export async function deleteSubsubjects(subsubjectIds: number[]) {
  try {
    const { error } = await supabase
      .from('subsubjects')
      .delete()
      .in('id', subsubjectIds);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting subsubjects:', error);
    throw error;
  }
}

// ============ Teachers CRUD Functions ============

// Create teacher (user with role='teacher')
export async function createTeacher(teacher: { name: string; email: string; subjects: string[] }) {
  try {
    // 1. Create the user without the role
    const { data: newTeacher, error: userError } = await supabase
      .from('users')
      .insert({
        name: teacher.name,
        email: teacher.email,
      })
      .select()
      .single();

    if (userError) throw userError;

    // 2. Get the 'teacher' role ID
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'teacher')
      .single();

    if (roleError) throw roleError;

    // 3. Link user to role in user_roles
    const { error: userRoleError } = await supabase
      .from('user_roles')
      .insert({ user_id: newTeacher.id, role_id: roleData.id });

    if (userRoleError) throw userRoleError;

    // 4. Handle subjects (using the correct 'subject_teachers' table)
    if (teacher.subjects && teacher.subjects.length > 0) {
      const { data: subjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('id, name')
        .in('name', teacher.subjects);

      if (subjectsError) throw subjectsError;

      const teacherSubjectRows = (subjects || []).map((subject: any) => ({
        teacher_id: newTeacher.id, // Correct column name
        subject_id: subject.id,
      }));

      if (teacherSubjectRows.length > 0) {
        const { error: tsError } = await supabase
          .from('subject_teachers') // Correct table name
          .insert(teacherSubjectRows);

        if (tsError) throw tsError;
      }
    }

    return newTeacher;
  } catch (error) {
    console.error('Error creating teacher:', error);
    throw error;
  }
}

// Create student (user with role='student')
export async function createStudent(student: { name: string; email: string; class?: string }) {
  try {
    const { data: newStudent, error: userError } = await supabase
      .from('users')
      .insert({ name: student.name, email: student.email })
      .select()
      .single();

    if (userError) throw userError;

    const { data: roleData, error: roleError } = await supabase.from('roles').select('id').eq('name', 'student').single();
    if (roleError) throw roleError;

    const { error: userRoleError } = await supabase.from('user_roles').insert({ user_id: newStudent.id, role_id: roleData.id });
    if (userRoleError) throw userRoleError;

    return newStudent;
  } catch (error) {
    console.error('Error creating student:', error);
    throw error;
  }
}

// Update student
export async function updateStudent(id: string, updates: { name: string; class?: string }) {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        name: updates.name,
      })
      .eq('id', parseInt(id));

    if (error) throw error;
  } catch (error) {
    console.error('Error updating student:', error);
    throw error;
  }
}

// Delete students
export async function deleteStudents(ids: string[]) {
  try {
    const numericIds = ids.map(id => parseInt(id));
    const { error } = await supabase
      .from('users')
      .delete()
      .in('id', numericIds);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting students:', error);
    throw error;
  }
}

// Update teacher
export async function updateTeacher(id: string, updates: { name: string; subjects: string[]; courses: string[] }) {
  try {
    // Update teacher name
    const { error: updateError } = await supabase
      .from('users')
      .update({
        name: updates.name,
      })
      .eq('id', parseInt(id));

    if (updateError) throw updateError;

    // Delete existing teacher-subject relationships
    const { error: deleteSubjectsError } = await supabase
      .from('subject_teachers')
      .delete()
      .eq('teacher_id', parseInt(id));

    if (deleteSubjectsError) throw deleteSubjectsError;

    // Delete existing teacher-subsubject relationships
    const { error: deleteSubsubjectsError } = await supabase
      .from('subsubject_teachers')
      .delete()
      .eq('teacher_id', parseInt(id));

    if (deleteSubsubjectsError) throw deleteSubsubjectsError;

    // Get subject IDs from subject names and insert new relationships
    if (updates.subjects && updates.subjects.length > 0) {
      const { data: subjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('id, name')
        .in('name', updates.subjects);

      if (subjectsError) throw subjectsError;

      const teacherSubjectRows = (subjects || []).map((subject: any) => ({
        teacher_id: parseInt(id),
        subject_id: subject.id,
      }));

      if (teacherSubjectRows.length > 0) {
        const { error: insertError } = await supabase
          .from('subject_teachers')
          .insert(teacherSubjectRows);

        if (insertError) throw insertError;
      }
    }

    // Get subsubject IDs from course names and insert new relationships
    if (updates.courses && updates.courses.length > 0) {
      const { data: subsubjects, error: subsubjectsError } = await supabase
        .from('subsubjects')
        .select('id, name')
        .in('name', updates.courses);

      if (subsubjectsError) throw subsubjectsError;

      const teacherSubsubjectRows = (subsubjects || []).map((subsubject: any) => ({
        teacher_id: parseInt(id),
        subsubject_id: subsubject.id,
      }));

      if (teacherSubsubjectRows.length > 0) {
        const { error: insertError } = await supabase
          .from('subsubject_teachers')
          .insert(teacherSubsubjectRows);

        if (insertError) throw insertError;
      }
    }
  } catch (error) {
    console.error('Error updating teacher:', error);
    throw error;
  }
}

// Delete teachers
export async function deleteTeachers(ids: string[]) {
  try {
    const numericIds = ids.map(id => parseInt(id));

    // 1. Delete from user_roles
    const { error: userRolesError } = await supabase
      .from('user_roles')
      .delete()
      .in('user_id', numericIds);
    if (userRolesError) throw userRolesError;

    // 2. Delete from subject_teachers
    const { error: subjectTeachersError } = await supabase
      .from('subject_teachers')
      .delete()
      .in('teacher_id', numericIds);
    if (subjectTeachersError) throw subjectTeachersError;

    // 3. Delete from subsubject_teachers
    const { error: subsubjectTeachersError } = await supabase
      .from('subsubject_teachers')
      .delete()
      .in('teacher_id', numericIds);
    if (subsubjectTeachersError) throw subsubjectTeachersError;

    // 4. Finally, delete from users
    const { error: usersError } = await supabase
      .from('users')
      .delete()
      .in('id', numericIds);
    if (usersError) throw usersError;

  } catch (error) {
    console.error('Error deleting teachers:', error);
    throw error;
  }
}
