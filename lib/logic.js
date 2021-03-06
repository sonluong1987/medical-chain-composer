/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/* global getAssetRegistry getFactory emit */

/**
 * Sample transaction processor function.
 * @param {org.acme.sample.CreatePatient} tx The sample transaction instance.
 * @transaction
 */
async function CreatePatient(tx) {  // eslint-disable-line no-unused-vars
    const factory = getFactory();
    const NS = 'org.acme.sample';

    const participantDetailsRegistry = await getAssetRegistry('org.acme.sample.PatientDetails');
    const participantRegistry = await getParticipantRegistry('org.acme.sample.Patient');

    patient = factory.newResource(NS, 'Patient', tx.patientId);
    patient.authorized = []
    // patient.medicalRecords = [{}]

    patientDetail = factory.newResource(NS, 'PatientDetails', tx.patientId);
    patientDetail.firstName = tx.firstName;
    patientDetail.lastName = tx.lastName;
    patientDetail.address = tx.address;
    patientDetail.dob = tx.dob;
    patientDetail.height = tx.height;
    patientDetail.weight = tx.weight;

    patientDetail.owner = factory.newRelationship(NS, 'Patient', tx.patientId);
    patient.personalDetails = factory.newRelationship(NS, 'PatientDetails', tx.patientId);

    await participantRegistry.add(patient)
    await participantDetailsRegistry.add(patientDetail);
}

/**
 * Sample transaction processor function.
 * @param {org.acme.sample.CreatePractitioner} tx The sample transaction instance.
 * @transaction
 */
async function CreatePractitioner(tx) {  // eslint-disable-line no-unused-vars
    const factory = getFactory();
    const NS = 'org.acme.sample';

    const participantDetailsRegistry = await getAssetRegistry('org.acme.sample.PractitionerDetails');
    const participantRegistry = await getParticipantRegistry('org.acme.sample.Practitioner');

    const practitioner = factory.newResource(NS, 'Practitioner', tx.practitionerId);
    const practitionerDetail = factory.newResource(NS, 'PractitionerDetails', tx.practitionerId);

    practitionerDetail.firstName = tx.firstName;
    practitionerDetail.lastName = tx.lastName;
    practitionerDetail.address = tx.address;

    practitionerDetail.owner = factory.newRelationship(NS, 'Practitioner', tx.practitionerId);
    practitioner.profile = factory.newRelationship(NS, 'PractitionerDetails', tx.practitionerId);

    await participantRegistry.add(practitioner)
    await participantDetailsRegistry.add(practitionerDetail);
}

/**
 * Sample transaction processor function.
 * @param {org.acme.sample.CreateRecord} tx The sample transaction instance.
 * @transaction
 */
async function CreateRecord(tx) {  // eslint-disable-line no-unused-vars
    const factory = getFactory();
    const NS = 'org.acme.sample';

    const patient = tx.patient;
    const practitioner = tx.practitioner;

    const record = factory.newResource(NS, 'MedicalRecord', tx.recordId);
    record.description = tx.description;
    
    const recordData = factory.newResource(NS, 'MedicalRecordData', tx.recordId);
    recordData.data = tx.data;
    recordData.record = factory.newRelationship(NS, 'MedicalRecord', tx.recordId);

    record.recordData = factory.newRelationship(NS,'MedicalRecordData', tx.recordId);
    record.date = tx.date;
    record.author = factory.newRelationship(NS, 'Practitioner', practitioner.getIdentifier());
    record.owner = factory.newRelationship(NS, 'Patient', patient.getIdentifier());

    const permissions = [];
    permissions.push(practitioner.getIdentifier());
    record.permissions = permissions;

    if (patient.medicalRecords)
        patient.medicalRecords.push(record);
    else 
        patient.medicalRecords = [record];

    // Get the asset registry for the asset.
    const assetRegistry = await getAssetRegistry(NS + '.MedicalRecord');
    await assetRegistry.add(record);

    const recordDataRegistry = await getAssetRegistry(NS + '.MedicalRecordData');
    await recordDataRegistry.add(recordData);

    const patientRegistry = await getParticipantRegistry(NS + '.Patient');
    await patientRegistry.update(patient);
}

/**
 * Sample transaction processor function.
 * @param {org.acme.sample.GrantAccessToPatient} tx The sample transaction instance.
 * @transaction
 */
async function GrantAccessToPatient(tx) {  // eslint-disable-line no-unused-vars
    const factory = getFactory();
    const NS = 'org.acme.sample';

    const patientRegistry = await getParticipantRegistry('org.acme.sample.Patient');
    const patient = tx.patient;

    if (patient.authorized) {
        if (patient.authorized.indexOf(tx.practitionerId) <= -1)
            patient.authorized.push(tx.practitionerId);
    }
    else {
        patient.authorized = [tx.practitionerId];
    }
    await patientRegistry.update(patient);
}

/**
 * Sample transaction processor function.
 * @param {org.acme.sample.RevokeAccessToPatient} tx The sample transaction instance.
 * @transaction
 */
async function RevokeAccessToPatient(tx) {  // eslint-disable-line no-unused-vars
    const factory = getFactory();
    const NS = 'org.acme.sample';

    const patientRegistry = await getParticipantRegistry('org.acme.sample.Patient');
    const patient = tx.patient;

    if (patient.authorized) {
        const authorized = patient.authorized;
        const index = authorized.indexOf(tx.practitionerId);
        if (index >= 0) {
            authorized.splice(index, 1);
            patient.authorized = authorized;
            await patientRegistry.update(patient);
        }
    }
}


/**
 * Sample transaction processor function.
 * @param {org.acme.sample.UpdateRecord} tx The sample transaction instance.
 * @transaction
 */
// async function UpdateRecord(tx) {  // eslint-disable-line no-unused-vars

//     // Save the old value of the asset.
//     const oldNote = tx.record.medicalNote;

//     // Update the asset with the new value.
//     tx.record.medicalNote = tx.newNote;

//     // Get the asset registry for the asset.
//     const assetRegistry = await getAssetRegistry('org.acme.sample.MedicalRecord');
//     // Update the asset in the asset registry.
//     await assetRegistry.update(tx.record);

//     // Emit an event for the modified asset.
//     let event = getFactory().newEvent('org.acme.sample', 'UpdateEvent');
//     event.medicalNote = tx.medicalNote;
//     event.oldNote = oldNote;
//     event.newValue = tx.newNote;
//     emit(event);
// }

/**
 * Sample transaction processor function.
 * @param {org.acme.sample.GrantAccessToRecord} tx The sample transaction instance.
 * @transaction
 */
async function GrantAccessToRecord(tx) {  // eslint-disable-line no-unused-vars

    // Add practitioner ID to record permissions
    tx.record.permissions.push(tx.practitionerId);

    // Get the asset registry for the asset.
    const assetRegistry = await getAssetRegistry('org.acme.sample.MedicalRecord');
    // Update the asset in the asset registry.
    await assetRegistry.update(tx.record);
}

/**
 * Sample transaction processor function.
 * @param {org.acme.sample.RevokeAccessToRecord} tx The sample transaction instance.
 * @transaction
 */
async function RevokeAccessToRecord(tx) {  // eslint-disable-line no-unused-vars
    let permissions = tx.record.permissions;
    for (let i = 0; i < permissions.length; i++) {
        if (permissions[i] == tx.practitionerId) {
            permissions.splice(i);
        }
    }
}

// /**
//  * Sample transaction processor function.
//  * @param {org.acme.sample.ReferPatient} tx The sample transaction instance.
//  * @transaction
//  */
// async function ReferPatient(tx) {  // eslint-disable-line no-unused-vars


//     // Save the old value of the asset.
//     const oldNote = tx.record.medicalNote;

//     // Update the asset with the new value.
//     tx.record.medicalNote = tx.newNote;

//     // Get the asset registry for the asset.
//     const assetRegistry = await getAssetRegistry('org.acme.sample.MedicalRecord');
//     // Update the asset in the asset registry.
//     await assetRegistry.update(tx.record);

//     // Emit an event for the modified asset.
//     let event = getFactory().newEvent('org.acme.sample', 'UpdateEvent');
//     event.medicalNote = tx.medicalNote;
//     event.oldNote = oldNote;
//     event.newValue = tx.newNote;
//     emit(event);
// }
