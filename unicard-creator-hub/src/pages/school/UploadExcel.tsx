import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SchoolHeader } from "@/components/SchoolHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrder } from "@/hooks/useOrder";
import { ArrowLeft, Upload, Download, CheckCircle, XCircle, FileSpreadsheet } from "lucide-react";
import * as XLSX from 'xlsx';

interface StudentData {
  student_name: string;
  father_name?: string;
  class: string;
  section?: string;
  roll_number?: string;
  student_id?: string;
  date_of_birth?: string;
  address?: string;
  gender?: string;
  phone_number?: string;
  blood_group?: string;
}

interface ColumnMapping {
  [key: string]: string;
}

const UploadExcel = () => {
  const navigate = useNavigate();
  const { currentOrder, refreshOrder, isOrderLocked } = useOrder();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [mappedData, setMappedData] = useState<StudentData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const requiredFields = ['student_name', 'class'];
  const optionalFields = ['father_name', 'section', 'roll_number', 'student_id', 'date_of_birth', 'address', 'gender', 'phone_number', 'blood_group'];

  if (isOrderLocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <SchoolHeader />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-lg text-muted-foreground">
                Order is locked. You cannot upload students after submission.
              </p>
              <Button onClick={() => navigate('/school/dashboard')} className="mt-4">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' && 
          selectedFile.type !== 'application/vnd.ms-excel') {
        toast.error('Please select a valid Excel file (.xlsx or .xls)');
        return;
      }
      setFile(selectedFile);
      parseExcelFile(selectedFile);
    }
  };

  const parseExcelFile = (file: File) => {
    setIsProcessing(true);
    setErrors([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          setErrors(['Excel file must have at least a header row and one data row']);
          setIsProcessing(false);
          return;
        }

        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];

        setExcelData(rows);
        
        // Auto-detect column mapping
        const autoMapping: ColumnMapping = {};
        headers.forEach((header, index) => {
          const lowerHeader = header?.toLowerCase() || '';
          
          // Try to match common variations
          if (lowerHeader.includes('name') && !lowerHeader.includes('father')) {
            autoMapping[header] = 'student_name';
          } else if (lowerHeader.includes('father') || lowerHeader.includes('parent')) {
            autoMapping[header] = 'father_name';
          } else if (lowerHeader.includes('class') || lowerHeader.includes('grade')) {
            autoMapping[header] = 'class';
          } else if (lowerHeader.includes('section') || lowerHeader.includes('div')) {
            autoMapping[header] = 'section';
          } else if (lowerHeader.includes('roll') || lowerHeader.includes('reg')) {
            autoMapping[header] = 'roll_number';
          } else if (lowerHeader.includes('id') && !lowerHeader.includes('roll')) {
            autoMapping[header] = 'student_id';
          } else if (lowerHeader.includes('dob') || lowerHeader.includes('birth') || lowerHeader.includes('date')) {
            autoMapping[header] = 'date_of_birth';
          } else if (lowerHeader.includes('address') || lowerHeader.includes('addr')) {
            autoMapping[header] = 'address';
          } else if (lowerHeader.includes('gender') || lowerHeader.includes('sex')) {
            autoMapping[header] = 'gender';
          } else if (lowerHeader.includes('phone') || lowerHeader.includes('mobile') || lowerHeader.includes('contact')) {
            autoMapping[header] = 'phone_number';
          } else if (lowerHeader.includes('blood') || lowerHeader.includes('group')) {
            autoMapping[header] = 'blood_group';
          }
        });

        setColumnMapping(autoMapping);
        processMappedData(rows, autoMapping);
        toast.success(`Excel file parsed successfully! Found ${rows.length} rows.`);
      } catch (error) {
        console.error('Error parsing Excel:', error);
        setErrors(['Failed to parse Excel file. Please check the file format.']);
        toast.error('Failed to parse Excel file');
      }
      setIsProcessing(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const processMappedData = (rows: any[][], mapping: ColumnMapping) => {
    const processed: StudentData[] = [];
    const newErrors: string[] = [];

    rows.forEach((row, index) => {
      const student: StudentData = {
        student_name: '',
        class: ''
      };

      // Map data based on column mapping
      Object.entries(mapping).forEach(([excelColumn, studentField]) => {
        const columnIndex = Object.keys(columnMapping).indexOf(excelColumn);
        const value = row[columnIndex];
        
        if (value !== undefined && value !== null && value !== '') {
          (student as any)[studentField] = String(value).trim();
        }
      });

      // Validate required fields
      if (!student.student_name) {
        newErrors.push(`Row ${index + 2}: Student name is required`);
      }
      if (!student.class) {
        newErrors.push(`Row ${index + 2}: Class is required`);
      }

      // Validate date format if provided
      if (student.date_of_birth) {
        const date = new Date(student.date_of_birth);
        if (isNaN(date.getTime())) {
          newErrors.push(`Row ${index + 2}: Invalid date format for date of birth`);
        } else {
          student.date_of_birth = date.toISOString().split('T')[0];
        }
      }

      processed.push(student);
    });

    setMappedData(processed);
    setErrors(newErrors);
  };

  const handleMappingChange = (excelColumn: string, studentField: string) => {
    const newMapping = { ...columnMapping, [excelColumn]: studentField };
    setColumnMapping(newMapping);
    processMappedData(excelData, newMapping);
  };

  const handleUpload = async () => {
    if (!currentOrder || mappedData.length === 0) {
      toast.error('No data to upload');
      return;
    }

    if (errors.length > 0) {
      toast.error('Please fix errors before uploading');
      return;
    }

    setIsUploading(true);

    try {
      // Prepare student data for database
      const studentsToInsert = mappedData.map(student => ({
        order_id: currentOrder.id,
        student_name: student.student_name,
        father_name: student.father_name || null,
        date_of_birth: student.date_of_birth || null,
        roll_number: student.roll_number || null,
        student_id: student.student_id || null,
        class: student.class,
        section: student.section || null,
        address: student.address || null,
        gender: student.gender || null,
        phone_number: student.phone_number || null,
        blood_group: student.blood_group || null,
      }));

      const { error } = await supabase
        .from('students')
        .insert(studentsToInsert);

      if (error) {
        console.error('Error uploading students:', error);
        toast.error('Failed to upload students');
        return;
      }

      toast.success(`Successfully uploaded ${mappedData.length} students!`);
      await refreshOrder();
      navigate('/school/students');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('An error occurred during upload');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      ['Student Name', 'Father Name', 'Class', 'Section', 'Roll Number', 'Student ID', 'Date of Birth', 'Address', 'Gender', 'Phone Number', 'Blood Group'],
      ['John Doe', 'Robert Doe', 'Class 10', 'A', '001', 'STU001', '2010-05-15', '123 Main St', 'Male', '+91 9876543210', 'A+'],
      ['Jane Smith', 'Michael Smith', 'Class 10', 'B', '002', 'STU002', '2010-08-20', '456 Oak Ave', 'Female', '+91 9876543211', 'B+']
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'student_template.xlsx');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <SchoolHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/school/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <Button onClick={downloadTemplate} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Upload Excel File
              </CardTitle>
              <CardDescription>
                Upload an Excel file with student data. Download the template for reference.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="excel-file">Select Excel File</Label>
                  <Input
                    id="excel-file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                    className="mt-2"
                  />
                </div>

                {file && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Selected File: {file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Size: {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                )}

                {isProcessing && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Processing Excel file...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Column Mapping */}
          {excelData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Column Mapping</CardTitle>
                <CardDescription>
                  Map Excel columns to student fields. Required fields are marked with *.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {Object.keys(columnMapping).map((excelColumn) => (
                    <div key={excelColumn} className="flex items-center gap-2">
                      <Label className="w-32 text-sm truncate" title={excelColumn}>
                        {excelColumn}
                      </Label>
                      <span className="text-muted-foreground">→</span>
                      <Select
                        value={columnMapping[excelColumn]}
                        onValueChange={(value) => handleMappingChange(excelColumn, value)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Skip this column</SelectItem>
                          {requiredFields.map((field) => (
                            <SelectItem key={field} value={field}>
                              {field.replace('_', ' ')} *
                            </SelectItem>
                          ))}
                          {optionalFields.map((field) => (
                            <SelectItem key={field} value={field}>
                              {field.replace('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-destructive">Validation Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {errors.map((error, index) => (
                  <Alert key={index} variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview */}
        {mappedData.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Preview Data ({mappedData.length} students)</CardTitle>
              <CardDescription>
                Review the mapped data before uploading. Only the first 5 rows are shown.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Father</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Roll No.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mappedData.slice(0, 5).map((student, index) => (
                      <TableRow key={index}>
                        <TableCell>{student.student_name || '-'}</TableCell>
                        <TableCell>{student.father_name || '-'}</TableCell>
                        <TableCell>{student.class || '-'}</TableCell>
                        <TableCell>{student.section || '-'}</TableCell>
                        <TableCell>{student.roll_number || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Button */}
        {mappedData.length > 0 && errors.length === 0 && (
          <div className="mt-6 text-center">
            <Button 
              onClick={handleUpload} 
              disabled={isUploading}
              size="lg"
              className="w-full sm:w-auto"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : `Upload ${mappedData.length} Students`}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default UploadExcel;
