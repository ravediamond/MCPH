// Basic type declarations for express
declare module "express" {
  import { EventEmitter } from "events";
  import { IncomingMessage, ServerResponse } from "http";

  export interface Request extends IncomingMessage {
    body: any;
    params: Record<string, string>;
    query: Record<string, string>;
    headers: Record<string, string | string[] | undefined>;
    cookies: Record<string, string>;
    path: string;
    method: string;
    ip: string;
    app: Application;
    [key: string]: any;
  }

  export interface Response extends ServerResponse {
    status(code: number): Response;
    send(body: any): Response;
    json(body: any): Response;
    end(): Response;
    setHeader(name: string, value: string | string[]): Response;
    cookie(name: string, value: string, options?: any): Response;
    clearCookie(name: string, options?: any): Response;
    redirect(url: string): Response;
    redirect(status: number, url: string): Response;
    [key: string]: any;
  }

  export interface NextFunction {
    (err?: any): void;
  }

  export interface RequestHandler {
    (req: Request, res: Response, next: NextFunction): any;
  }

  export interface ErrorRequestHandler {
    (err: any, req: Request, res: Response, next: NextFunction): any;
  }

  export interface Application {
    get(path: string, ...handlers: RequestHandler[]): Application;
    post(path: string, ...handlers: RequestHandler[]): Application;
    put(path: string, ...handlers: RequestHandler[]): Application;
    delete(path: string, ...handlers: RequestHandler[]): Application;
    use(...handlers: RequestHandler[]): Application;
    use(path: string, ...handlers: RequestHandler[]): Application;
    listen(port: number, callback?: () => void): any;
    [key: string]: any;
  }

  export interface Router {
    get(path: string, ...handlers: RequestHandler[]): Router;
    post(path: string, ...handlers: RequestHandler[]): Router;
    put(path: string, ...handlers: RequestHandler[]): Router;
    delete(path: string, ...handlers: RequestHandler[]): Router;
    use(...handlers: RequestHandler[]): Router;
    use(path: string, ...handlers: RequestHandler[]): Router;
    [key: string]: any;
  }

  export function Router(options?: any): Router;

  export default function createApplication(): Application;
}

// Add uuid module declaration
declare module "uuid" {
  export function v4(): string;
  export function v1(): string;
  export function validate(uuid: string): boolean;
  export function version(uuid: string): number;
}

// Add firebase-admin type declarations
declare module "firebase-admin/app" {
  export interface App {}
  export interface ServiceAccount {
    projectId?: string;
    clientEmail?: string;
    privateKey?: string;
  }
  export function getApp(name?: string): App;
  export function initializeApp(options?: any, name?: string): App;
  export function cert(serviceAccount: object): any;
  export function getApps(): App[];
}

declare module "firebase-admin/auth" {
  export interface Auth {
    verifyIdToken(idToken: string): Promise<any>;
    getUser(uid: string): Promise<any>;
  }
  export function getAuth(): Auth;
}

declare module "firebase-admin/firestore" {
  export type Firestore = any;
  export type CollectionReference<T = any> = any;
  export type DocumentReference<T = any> = any;
  export type DocumentData = any;
  export interface QueryDocumentSnapshot<T = any> {
    data(): T;
    id: string;
    exists: boolean;
    ref: DocumentReference<T>;
  }
  export type Query<T = any> = any;
  export type WhereFilterOp = any;
  export interface DocumentSnapshot<T = any> {
    data(): T | undefined;
    id: string;
    exists: boolean;
    ref: DocumentReference<T>;
  }
  export type WriteResult = any;
  export interface QuerySnapshot<T = any> {
    empty: boolean;
    docs: QueryDocumentSnapshot<T>[];
    size: number;
    forEach(callback: (doc: QueryDocumentSnapshot<T>) => void): void;
  }
  export class FieldValue {
    static increment(n: number): FieldValue;
  }

  export function getFirestore(app?: any): Firestore;
  export function collection(
    firestore: Firestore,
    path: string,
  ): CollectionReference;
  export function doc(
    firestore: Firestore,
    path: string,
    ...pathSegments: string[]
  ): DocumentReference;
  export function doc(
    reference: CollectionReference,
    path?: string,
  ): DocumentReference;
  export function getDoc(
    reference: DocumentReference,
  ): Promise<DocumentSnapshot>;
  export function getDocs<T>(query: Query<T>): Promise<QuerySnapshot<T>>;
  export function query<T>(
    reference: CollectionReference<T>,
    ...queryConstraints: any[]
  ): Query<T>;
  export function where(
    fieldPath: string,
    opStr: WhereFilterOp,
    value: any,
  ): any;
  export function limit(limit: number): any;
  export function orderBy(
    fieldPath: string,
    directionStr?: "asc" | "desc",
  ): any;
  export function increment(n: number): FieldValue;
  export function setDoc(
    reference: DocumentReference,
    data: any,
  ): Promise<WriteResult>;
  export function addDoc(
    reference: CollectionReference,
    data: any,
  ): Promise<DocumentReference>;
  export function updateDoc(
    reference: DocumentReference,
    data: any,
  ): Promise<WriteResult>;
  export function deleteDoc(reference: DocumentReference): Promise<WriteResult>;
}

// Firebase app declarations
declare module "firebase/app" {
  export interface FirebaseApp {}
  export function initializeApp(options: any, name?: string): FirebaseApp;
  export function getApp(name?: string): FirebaseApp;
  export function getApps(): FirebaseApp[];
}

declare module "firebase/auth" {
  export interface Auth {}
  export class GoogleAuthProvider {}
  export function getAuth(app?: any): Auth;
  export function signInWithPopup(auth: Auth, provider: any): Promise<any>;
  export function signInWithEmailAndPassword(
    auth: Auth,
    email: string,
    password: string,
  ): Promise<any>;
  export function createUserWithEmailAndPassword(
    auth: Auth,
    email: string,
    password: string,
  ): Promise<any>;
  export function signOut(auth: Auth): Promise<void>;
}

declare module "firebase/firestore" {
  export type Firestore = any;
  export type CollectionReference = any;
  export type DocumentReference = any;
  export type Query = any;

  export function getFirestore(app?: any): Firestore;
  export function collection(
    firestore: Firestore,
    path: string,
  ): CollectionReference;
  export function doc(
    firestore: Firestore,
    path: string,
    ...pathSegments: string[]
  ): DocumentReference;
  export function getDoc(reference: DocumentReference): Promise<any>;
  export function getDocs(query: Query): Promise<any>;
  export function query(
    reference: CollectionReference,
    ...queryConstraints: any[]
  ): Query;
  export function where(fieldPath: string, opStr: string, value: any): any;
}

// Google cloud storage declarations
declare module "@google-cloud/storage" {
  export interface StorageOptions {
    projectId?: string;
    keyFilename?: string;
    credentials?: any;
  }

  export class Storage {
    constructor(options?: StorageOptions);
    bucket(name: string): Bucket;
    projectId?: string;
  }

  export interface Bucket {
    file(path: string): File;
    getFiles(options?: any): Promise<[File[]]>;
    upload(path: string, options?: any): Promise<any>;
  }

  export interface File {
    getSignedUrl(options: {
      action: string;
      expires: string | Date | number;
      version?: string;
      contentType?: string;
      extensionHeaders?: Record<string, string>;
      responseDisposition?: string;
    }): Promise<[string]>;
    delete(): Promise<any>;
    copy(destination: string | File): Promise<any>;
    getMetadata(): Promise<any>;
    setMetadata(metadata: any): Promise<any>;
    exists(): Promise<[boolean]>;
    download(): Promise<[Buffer]>;
    save(data: Buffer, options?: any): Promise<any>;
    createReadStream(): NodeJS.ReadableStream;
  }
}

// Google auth library declarations
declare module "google-auth-library" {
  export class GoogleAuth {
    constructor(options?: any);
    getClient(): Promise<any>;
  }
}

// Firebase app declarations
declare module "firebase/app" {
  export interface FirebaseApp {}
  export function initializeApp(options: any, name?: string): FirebaseApp;
  export function getApp(name?: string): FirebaseApp;
}

declare module "firebase/auth" {
  export interface Auth {}
  export function getAuth(): Auth;
  export function signInWithEmailAndPassword(
    auth: Auth,
    email: string,
    password: string,
  ): Promise<any>;
  export function createUserWithEmailAndPassword(
    auth: Auth,
    email: string,
    password: string,
  ): Promise<any>;
  export function signOut(auth: Auth): Promise<void>;
}

declare module "firebase/firestore" {
  export type Firestore = any;
  export type CollectionReference = any;
  export type DocumentReference = any;
  export type Query = any;

  export function getFirestore(): Firestore;
  export function collection(
    firestore: Firestore,
    path: string,
  ): CollectionReference;
  export function doc(
    firestore: Firestore,
    path: string,
    ...pathSegments: string[]
  ): DocumentReference;
  export function getDoc(reference: DocumentReference): Promise<any>;
  export function getDocs(query: Query): Promise<any>;
  export function query(
    reference: CollectionReference,
    ...queryConstraints: any[]
  ): Query;
  export function where(fieldPath: string, opStr: string, value: any): any;
}

// Google cloud storage declarations
declare module "@google-cloud/storage" {
  export class Storage {
    constructor(options?: any);
    bucket(name: string): Bucket;
  }

  export interface Bucket {
    file(path: string): File;
    getFiles(options?: any): Promise<[File[]]>;
    upload(path: string, options?: any): Promise<any>;
  }

  export interface File {
    getSignedUrl(options: {
      action: string;
      expires: string | Date;
    }): Promise<[string]>;
    delete(): Promise<any>;
    copy(destination: string | File): Promise<any>;
    getMetadata(): Promise<any>;
    setMetadata(metadata: any): Promise<any>;
  }
}

// Google auth library declarations
declare module "google-auth-library" {
  export class GoogleAuth {
    constructor(options?: any);
    getClient(): Promise<any>;
  }
}
