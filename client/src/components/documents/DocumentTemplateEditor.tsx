import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { FileText, Save, Copy, Download, Loader2 } from 'lucide-react';

// Default templates for different document types
const DEFAULT_TEMPLATES = {
  standard: `ASSURED SHORTHOLD TENANCY AGREEMENT

THIS AGREEMENT is made on [DATE]

BETWEEN:

[LANDLORD_NAME] of [LANDLORD_ADDRESS]
(hereinafter called "the Landlord")

AND

[TENANT_NAME]
(hereinafter called "the Tenant")

IT IS AGREED AS FOLLOWS:

1. PROPERTY
The Landlord lets and the Tenant takes the residential property at:
[PROPERTY_ADDRESS]
(hereinafter called "the Property")

2. TERM
The tenancy shall be for a fixed term of [TERM_MONTHS] months,
commencing on [START_DATE] and ending on [END_DATE].

3. RENT
The Tenant shall pay rent of £[RENT_AMOUNT] per [RENT_FREQUENCY],
payable in advance on the [PAYMENT_DAY] of each [PAYMENT_PERIOD].

4. DEPOSIT
The Tenant shall pay a deposit of £[DEPOSIT_AMOUNT] to be protected in the [DEPOSIT_SCHEME]
within 30 days of receipt.

5. USE OF PROPERTY
The Property shall be used solely as a private residence for the occupation of the Tenant.

6. FURNITURE
[FURNITURE_CLAUSE]

7. TENANT OBLIGATIONS
The Tenant agrees:
a) To pay the rent on the due date.
b) To use the Property as a single private residence.
c) To keep the Property in a clean and tidy condition.
d) To allow the Landlord or their agent access to the Property for inspections with 24 hours' notice.
e) Not to cause a nuisance to neighbors.
f) Not to make alterations to the Property without written consent.
g) To report any damages or necessary repairs promptly.

8. LANDLORD OBLIGATIONS
The Landlord agrees:
a) To maintain the structure and exterior of the Property.
b) To ensure all gas and electrical appliances provided are safe.
c) To provide a valid Energy Performance Certificate.
d) To provide a valid Gas Safety Certificate (where applicable).
e) To ensure smoke and carbon monoxide alarms are in working order.
f) To ensure the Property is fit for human habitation.

9. TERMINATION
This tenancy cannot be terminated before the end of the fixed term except by:
a) Mutual agreement between the Landlord and Tenant.
b) Serious breach of the tenancy agreement.
c) The provisions of the Housing Act 1988.

10. NOTICE
At the end of the fixed term, to end the tenancy:
a) The Landlord must give at least two months' notice in writing.
b) The Tenant must give at least one month's notice in writing.

11. RENEWAL
This tenancy may be renewed for a further term by agreement between the parties.

12. DEPOSIT RETURN
The deposit will be returned to the Tenant within 10 days of the end of the tenancy, less any deductions for:
a) Damage to the Property or its contents (fair wear and tear excepted).
b) Unpaid rent or other charges.
c) Cleaning required to return the Property to its original condition.

[UTILITIES_CLAUSE]
[HMO_CLAUSE]
[RIGHT_TO_RENT_CLAUSE]

[ADDITIONAL_TERMS]

SIGNED BY:

Landlord: [LANDLORD_NAME]
Date: ____________________

Tenant: [TENANT_NAME]
Date: ____________________

WITNESSES:

Name: ____________________
Address: ____________________
Signature: ____________________
Date: ____________________

Name: ____________________
Address: ____________________
Signature: ____________________
Date: ____________________`,

  hmo: `HOUSE IN MULTIPLE OCCUPATION (HMO) TENANCY AGREEMENT

THIS AGREEMENT is made on [DATE]

BETWEEN:

[LANDLORD_NAME] of [LANDLORD_ADDRESS]
(hereinafter called "the Landlord")

AND

[TENANT_NAME]
(hereinafter called "the Tenant")

IT IS AGREED AS FOLLOWS:

1. PROPERTY
The Landlord lets and the Tenant takes the residential property at:
[PROPERTY_ADDRESS]
(hereinafter called "the Property")

This is a House in Multiple Occupation (HMO) licensed under the Housing Act 2004. The Tenant will have exclusive occupation of the room [ROOM_NUMBER] and shared use of common areas including kitchen, bathroom, and living areas.

2. TERM
The tenancy shall be for a fixed term of [TERM_MONTHS] months,
commencing on [START_DATE] and ending on [END_DATE].

3. RENT
The Tenant shall pay rent of £[RENT_AMOUNT] per [RENT_FREQUENCY],
payable in advance on the [PAYMENT_DAY] of each [PAYMENT_PERIOD].

4. DEPOSIT
The Tenant shall pay a deposit of £[DEPOSIT_AMOUNT] to be protected in the [DEPOSIT_SCHEME]
within 30 days of receipt.

5. USE OF PROPERTY
The Property shall be used solely as a private residence for the occupation of the Tenant.

6. FURNITURE
[FURNITURE_CLAUSE]

7. TENANT OBLIGATIONS
The Tenant agrees:
a) To pay the rent on the due date.
b) To use the Property as a single private residence.
c) To keep their room and the shared areas clean and tidy.
d) To allow the Landlord or their agent access to the Property for inspections with 24 hours' notice.
e) Not to cause a nuisance to other tenants or neighbors.
f) Not to make alterations to the Property without written consent.
g) To report any damages or necessary repairs promptly.
h) To comply with all HMO regulations and fire safety procedures.

8. LANDLORD OBLIGATIONS
The Landlord agrees:
a) To maintain the structure and exterior of the Property.
b) To ensure all gas and electrical appliances provided are safe.
c) To provide a valid Energy Performance Certificate.
d) To provide a valid Gas Safety Certificate.
e) To ensure smoke and carbon monoxide alarms are in working order.
f) To ensure the Property is fit for human habitation.
g) To maintain all fire safety equipment and emergency lighting.
h) To ensure the Property complies with all HMO licensing requirements.

9. TERMINATION
This tenancy cannot be terminated before the end of the fixed term except by:
a) Mutual agreement between the Landlord and Tenant.
b) Serious breach of the tenancy agreement.
c) The provisions of the Housing Act 1988.

10. NOTICE
At the end of the fixed term, to end the tenancy:
a) The Landlord must give at least two months' notice in writing.
b) The Tenant must give at least one month's notice in writing.

11. RENEWAL
This tenancy may be renewed for a further term by agreement between the parties.

12. DEPOSIT RETURN
The deposit will be returned to the Tenant within 10 days of the end of the tenancy, less any deductions for:
a) Damage to the Property or its contents (fair wear and tear excepted).
b) Unpaid rent or other charges.
c) Cleaning required to return the Property to its original condition.

13. HMO LICENSING
This property is licensed as a House in Multiple Occupation (HMO) under the Housing Act 2004. The Landlord confirms that they comply with all relevant HMO regulations and standards.

14. RIGHT TO RENT
The Landlord confirms that Right to Rent checks have been carried out in accordance with the Immigration Act 2014. The Tenant confirms they have legal right to rent in the UK and has provided documentation as required by law.

[UTILITIES_CLAUSE]

[ADDITIONAL_TERMS]

SIGNED BY:

Landlord: [LANDLORD_NAME]
Date: ____________________

Tenant: [TENANT_NAME]
Date: ____________________

WITNESSES:

Name: ____________________
Address: ____________________
Signature: ____________________
Date: ____________________

Name: ____________________
Address: ____________________
Signature: ____________________
Date: ____________________`,

  all_inclusive: `ALL-INCLUSIVE ASSURED SHORTHOLD TENANCY AGREEMENT

THIS AGREEMENT is made on [DATE]

BETWEEN:

[LANDLORD_NAME] of [LANDLORD_ADDRESS]
(hereinafter called "the Landlord")

AND

[TENANT_NAME]
(hereinafter called "the Tenant")

IT IS AGREED AS FOLLOWS:

1. PROPERTY
The Landlord lets and the Tenant takes the residential property at:
[PROPERTY_ADDRESS]
(hereinafter called "the Property")

2. TERM
The tenancy shall be for a fixed term of [TERM_MONTHS] months,
commencing on [START_DATE] and ending on [END_DATE].

3. RENT
The Tenant shall pay rent of £[RENT_AMOUNT] per [RENT_FREQUENCY],
payable in advance on the [PAYMENT_DAY] of each [PAYMENT_PERIOD].

4. DEPOSIT
The Tenant shall pay a deposit of £[DEPOSIT_AMOUNT] to be protected in the [DEPOSIT_SCHEME]
within 30 days of receipt.

5. USE OF PROPERTY
The Property shall be used solely as a private residence for the occupation of the Tenant.

6. FURNITURE
[FURNITURE_CLAUSE]

7. TENANT OBLIGATIONS
The Tenant agrees:
a) To pay the rent on the due date.
b) To use the Property as a single private residence.
c) To keep the Property in a clean and tidy condition.
d) To allow the Landlord or their agent access to the Property for inspections with 24 hours' notice.
e) Not to cause a nuisance to neighbors.
f) Not to make alterations to the Property without written consent.
g) To report any damages or necessary repairs promptly.
h) To use utilities reasonably and not excessively.

8. LANDLORD OBLIGATIONS
The Landlord agrees:
a) To maintain the structure and exterior of the Property.
b) To ensure all gas and electrical appliances provided are safe.
c) To provide a valid Energy Performance Certificate.
d) To provide a valid Gas Safety Certificate (where applicable).
e) To ensure smoke and carbon monoxide alarms are in working order.
f) To ensure the Property is fit for human habitation.
g) To pay for all utility bills as specified in Section 13.

9. TERMINATION
This tenancy cannot be terminated before the end of the fixed term except by:
a) Mutual agreement between the Landlord and Tenant.
b) Serious breach of the tenancy agreement.
c) The provisions of the Housing Act 1988.

10. NOTICE
At the end of the fixed term, to end the tenancy:
a) The Landlord must give at least two months' notice in writing.
b) The Tenant must give at least one month's notice in writing.

11. RENEWAL
This tenancy may be renewed for a further term by agreement between the parties.

12. DEPOSIT RETURN
The deposit will be returned to the Tenant within 10 days of the end of the tenancy, less any deductions for:
a) Damage to the Property or its contents (fair wear and tear excepted).
b) Unpaid rent or other charges.
c) Cleaning required to return the Property to its original condition.

13. UTILITIES AND SERVICES
This is an all-inclusive tenancy. The following utilities and services are included in the rent:
a) Gas
b) Electricity
c) Water
d) Broadband internet
e) Council Tax

The Landlord reserves the right to impose reasonable limits on utility usage. Excessive usage may result in additional charges, which will be notified to the Tenant in advance.

14. RIGHT TO RENT
The Landlord confirms that Right to Rent checks have been carried out in accordance with the Immigration Act 2014. The Tenant confirms they have legal right to rent in the UK and has provided documentation as required by law.

[HMO_CLAUSE]

[ADDITIONAL_TERMS]

SIGNED BY:

Landlord: [LANDLORD_NAME]
Date: ____________________

Tenant: [TENANT_NAME]
Date: ____________________

WITNESSES:

Name: ____________________
Address: ____________________
Signature: ____________________
Date: ____________________

Name: ____________________
Address: ____________________
Signature: ____________________
Date: ____________________`,

  joint_tenancy: `JOINT TENANCY AGREEMENT

THIS AGREEMENT is made on [DATE]

BETWEEN:

[LANDLORD_NAME] of [LANDLORD_ADDRESS]
(hereinafter called "the Landlord")

AND

[TENANT_1_NAME], [TENANT_2_NAME], [TENANT_3_NAME], [TENANT_4_NAME]
(hereinafter collectively called "the Tenants" and individually "the Tenant")

IT IS AGREED AS FOLLOWS:

1. PROPERTY
The Landlord lets and the Tenants take the residential property at:
[PROPERTY_ADDRESS]
(hereinafter called "the Property")

2. JOINT AND SEVERAL LIABILITY
The Tenants agree that they shall be jointly and severally liable for all obligations contained within this agreement, including payment of rent and any damages. This means that each Tenant is liable for the full obligations under this agreement if the other Tenants fail to pay or comply.

3. TERM
The tenancy shall be for a fixed term of [TERM_MONTHS] months,
commencing on [START_DATE] and ending on [END_DATE].

4. RENT
The Tenants shall pay a total rent of £[RENT_AMOUNT] per [RENT_FREQUENCY],
payable in advance on the [PAYMENT_DAY] of each [PAYMENT_PERIOD].

5. DEPOSIT
The Tenants shall pay a deposit of £[DEPOSIT_AMOUNT] to be protected in the [DEPOSIT_SCHEME]
within 30 days of receipt.

6. USE OF PROPERTY
The Property shall be used solely as a private residence for the occupation of the Tenants.

7. FURNITURE
[FURNITURE_CLAUSE]

8. TENANT OBLIGATIONS
The Tenants agree:
a) To pay the rent on the due date.
b) To use the Property as a private residence.
c) To keep the Property in a clean and tidy condition.
d) To allow the Landlord or their agent access to the Property for inspections with 24 hours' notice.
e) Not to cause a nuisance to neighbors.
f) Not to make alterations to the Property without written consent.
g) To report any damages or necessary repairs promptly.
h) To settle any disputes between themselves regarding division of rent or rooms.

9. LANDLORD OBLIGATIONS
The Landlord agrees:
a) To maintain the structure and exterior of the Property.
b) To ensure all gas and electrical appliances provided are safe.
c) To provide a valid Energy Performance Certificate.
d) To provide a valid Gas Safety Certificate (where applicable).
e) To ensure smoke and carbon monoxide alarms are in working order.
f) To ensure the Property is fit for human habitation.

10. TERMINATION
This tenancy cannot be terminated before the end of the fixed term except by:
a) Mutual agreement between the Landlord and all Tenants.
b) Serious breach of the tenancy agreement.
c) The provisions of the Housing Act 1988.

11. INDIVIDUAL TENANTS VACATING
If one Tenant wishes to vacate the Property during the fixed term:
a) They must obtain the Landlord's written consent.
b) The remaining Tenants will remain liable for the full rent unless otherwise agreed.
c) A replacement tenant may be allowed, subject to the Landlord's approval and Right to Rent checks.
d) A new tenancy agreement may be required at the Landlord's discretion.

12. NOTICE
At the end of the fixed term, to end the tenancy:
a) The Landlord must give at least two months' notice in writing.
b) The Tenants must collectively give at least one month's notice in writing.

13. RENEWAL
This tenancy may be renewed for a further term by agreement between the parties.

14. DEPOSIT RETURN
The deposit will be returned to the Tenants within 10 days of the end of the tenancy, less any deductions for:
a) Damage to the Property or its contents (fair wear and tear excepted).
b) Unpaid rent or other charges.
c) Cleaning required to return the Property to its original condition.

15. UTILITIES
The Tenants are responsible for all utility bills including:
a) Gas
b) Electricity
c) Water
d) Broadband internet
e) Council Tax

The Tenants agree to transfer all utility accounts into their names for the duration of the tenancy.

16. RIGHT TO RENT
The Landlord confirms that Right to Rent checks have been carried out for all Tenants in accordance with the Immigration Act 2014. Each Tenant confirms they have legal right to rent in the UK and has provided documentation as required by law.

[HMO_CLAUSE]

[ADDITIONAL_TERMS]

SIGNED BY:

Landlord: [LANDLORD_NAME]
Date: ____________________

Tenant 1: [TENANT_1_NAME]
Date: ____________________

Tenant 2: [TENANT_2_NAME]
Date: ____________________

Tenant 3: [TENANT_3_NAME]
Date: ____________________

Tenant 4: [TENANT_4_NAME]
Date: ____________________

WITNESSES:

Name: ____________________
Address: ____________________
Signature: ____________________
Date: ____________________`,

  right_to_rent: `RIGHT TO RENT VERIFICATION FORM

PROPERTY DETAILS:
Property Address: [PROPERTY_ADDRESS]

TENANT DETAILS:
Full Name: [TENANT_NAME]
Date of Birth: [DOB]
Nationality: [NATIONALITY]
Contact Details: [CONTACT_DETAILS]

LANDLORD/AGENT DETAILS:
Name: [LANDLORD_NAME]
Address: [LANDLORD_ADDRESS]
Contact Details: [LANDLORD_CONTACT]

RIGHT TO RENT CHECK DETAILS:
Check Performed By: [CHECKER_NAME]
Date of Check: [CHECK_DATE]
Tenancy Start Date: [START_DATE]

IDENTIFICATION DOCUMENTS VERIFIED:
Document Type: [DOCUMENT_TYPE]
Document Number: [DOCUMENT_NUMBER]
Document Expiry: [DOCUMENT_EXPIRY]
Document Copy Attached: Yes / No

CONFIRMATION:
☐ I confirm that the original document(s) has been checked
☐ I confirm that the document(s) appear to be genuine
☐ I confirm that the document(s) belong to the tenant
☐ I confirm the tenant's right to rent status has been verified
☐ I confirm copies of all documents have been made and will be securely retained for the duration of the tenancy and for at least one year after the tenancy ends

RIGHT TO RENT STATUS:
☐ Unlimited Right to Rent
☐ Time-Limited Right to Rent - Expiry date: [TIME_LIMITED_EXPIRY]
  (Follow-up check required before this date)

TENANT DECLARATION:
I confirm that the information I have provided is accurate and complete. I understand that providing false information may lead to criminal prosecution.

Tenant Signature: ____________________
Date: ____________________

LANDLORD/AGENT DECLARATION:
I confirm that I have conducted Right to Rent checks in accordance with the Immigration Act 2014 and the Immigration (Residential Accommodation) (Prescribed Requirements and Codes of Practice) Order 2014.

Landlord/Agent Signature: ____________________
Date: ____________________

IMPORTANT:
- It is a legal requirement to check that all tenants have the right to rent in the UK
- Original documents must be checked in the presence of the document holder
- Follow-up checks must be conducted if the tenant has a time-limited right to rent
- Records must be kept for the duration of the tenancy and for at least one year after it ends
- Failure to conduct proper checks could result in a civil penalty of up to £3,000 per illegal occupier`,

  deposit_protection: `DEPOSIT PROTECTION CERTIFICATE

Certificate Number: [CERTIFICATE_NUMBER]
Date of Issue: [DATE]

PROPERTY:
[PROPERTY_ADDRESS]

TENANT DETAILS:
[TENANT_NAME]
[TENANT_CONTACT]

LANDLORD/AGENT DETAILS:
[LANDLORD_NAME]
[LANDLORD_ADDRESS]
[LANDLORD_CONTACT]

DEPOSIT DETAILS:
Amount Received: £[DEPOSIT_AMOUNT]
Date Received: [DEPOSIT_RECEIPT_DATE]
Tenancy Start Date: [START_DATE]
Tenancy End Date: [END_DATE]

PROTECTION SCHEME:
This deposit has been protected with:
[DEPOSIT_SCHEME]
Scheme Reference: [SCHEME_REFERENCE]
Protection Date: [PROTECTION_DATE]

STATUTORY INFORMATION:
1. The deposit is being held in accordance with the terms and conditions of the [DEPOSIT_SCHEME].
2. The deposit has been protected within 30 days of receipt as required by law.
3. Information about the tenancy deposit protection requirements can be found in the Housing Act 2004.
4. If the tenant and landlord agree on the deposit's return, it will be paid back according to their agreement.
5. If there is a dispute over the deposit, the [DEPOSIT_SCHEME] provides a free dispute resolution service.

PRESCRIBED INFORMATION CONFIRMATION:
☐ The prescribed information has been provided to the tenant(s)
☐ The deposit protection scheme's terms and conditions have been made available to the tenant(s)
☐ The tenant(s) has been informed how the deposit is protected

DEPOSIT RETURN CONDITIONS:
The deposit will be repaid following agreement between landlord and tenant at the end of the tenancy, less any deductions for:
- Damage to the property (beyond fair wear and tear)
- Unpaid rent or bills
- Missing items from the inventory
- Cleaning costs (if property not returned in a clean condition)

TENANT ACKNOWLEDGMENT:
I/We confirm receipt of this certificate and understand how my/our deposit is protected.

Tenant Signature: ____________________
Date: ____________________

LANDLORD/AGENT DECLARATION:
I confirm that the deposit has been protected in accordance with legal requirements.

Landlord/Agent Signature: ____________________
Date: ____________________`
};

export default function DocumentTemplateEditor() {
  const { userType } = useAuth();
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState('standard');
  const [templateText, setTemplateText] = useState(DEFAULT_TEMPLATES.standard);
  const [originalTemplate, setOriginalTemplate] = useState(DEFAULT_TEMPLATES.standard);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load the appropriate template when selection changes
  useEffect(() => {
    if (DEFAULT_TEMPLATES[selectedTemplate]) {
      setTemplateText(DEFAULT_TEMPLATES[selectedTemplate]);
      setOriginalTemplate(DEFAULT_TEMPLATES[selectedTemplate]);
    }
  }, [selectedTemplate]);

  // Reset to original
  const resetTemplate = () => {
    setTemplateText(originalTemplate);
    toast({
      title: 'Template Reset',
      description: 'The template has been reset to the original version.',
    });
  };

  // Save template changes
  const saveTemplate = () => {
    setIsSaving(true);
    // In a real application, this would make an API call to save to a database
    setTimeout(() => {
      setIsSaving(false);
      setOriginalTemplate(templateText);
      setIsEditing(false);
      toast({
        title: 'Template Saved',
        description: 'Your template changes have been saved successfully.',
      });
    }, 1000);
  };

  // Copy template to clipboard
  const copyTemplate = () => {
    navigator.clipboard.writeText(templateText).then(() => {
      toast({
        title: 'Copied',
        description: 'Template copied to clipboard',
      });
    });
  };

  // Download the template
  const downloadTemplate = () => {
    const blob = new Blob([templateText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_${selectedTemplate}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const availableTemplates = {
    standard: { name: 'Standard AST', description: 'Standard Assured Shorthold Tenancy agreement for most rental situations' },
    hmo: { name: 'HMO Agreement', description: 'For Houses in Multiple Occupation with shared facilities' },
    all_inclusive: { name: 'All-Inclusive', description: 'All bills included agreement with utility provisions' },
    joint_tenancy: { name: 'Joint Tenancy', description: 'For groups of tenants sharing a property' },
    right_to_rent: { name: 'Right to Rent', description: 'Right to Rent verification form' },
    deposit_protection: { name: 'Deposit Protection', description: 'Deposit protection certificate template' },
  };

  const canEdit = userType === 'admin' || userType === 'agent';

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Document Template Manager</h1>
        <p className="text-muted-foreground mt-1">
          View, edit and manage legal document templates
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Available Templates</CardTitle>
              <CardDescription>
                Select a template to view or edit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(availableTemplates).map(([key, template]) => (
                <div
                  key={key}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedTemplate === key
                      ? 'border-primary/50 bg-primary/5'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedTemplate(key)}
                >
                  <h3 className="font-medium">{template.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {template.description}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>{availableTemplates[selectedTemplate]?.name || 'Template'}</CardTitle>
                <CardDescription>
                  {isEditing ? 'Edit template content' : 'View template details'}
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={copyTemplate}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                {canEdit && !isEditing && (
                  <Button size="sm" onClick={() => setIsEditing(true)}>
                    Edit Template
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              {isEditing ? (
                <Textarea
                  value={templateText}
                  onChange={(e) => setTemplateText(e.target.value)}
                  className="font-mono text-sm h-[600px]"
                />
              ) : (
                <div className="border rounded-md p-4 bg-gray-50 whitespace-pre-wrap font-mono text-sm h-[600px] overflow-y-auto">
                  {templateText}
                </div>
              )}
            </CardContent>
            {isEditing && (
              <CardFooter className="border-t px-6 py-4">
                <div className="flex justify-between w-full">
                  <Button variant="outline" onClick={resetTemplate}>
                    Reset
                  </Button>
                  <div className="space-x-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={saveTemplate}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Template
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}